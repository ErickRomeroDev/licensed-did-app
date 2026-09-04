// DEV-ONLY connector shim: a headless wallet on the local standalone chain exposed with the same dApp-connector v4
// surface as the 1AM extension (`window.midnight['dev-standalone']`). Loaded only when VITE_DEV_WALLET=true so
// production bundles never include the wallet SDK. Mirrors midnight-did/packages/api/src/wallet-context.ts (3.0.0 line).
import * as ledger from "@midnight-ntwrk/ledger-v8";
import type { ConnectedAPI, InitialAPI, KeyMaterialProvider } from "@midnight-ntwrk/dapp-connector-api";
import { httpClientProvingProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import type { ZKConfigProvider } from "@midnight-ntwrk/midnight-js-types";
import { DustWallet } from "@midnight-ntwrk/wallet-sdk-dust-wallet";
import { WalletFacade } from "@midnight-ntwrk/wallet-sdk-facade";
import { HDWallet, Roles } from "@midnight-ntwrk/wallet-sdk-hd";
import { ShieldedWallet } from "@midnight-ntwrk/wallet-sdk-shielded";
import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
  type UnshieldedKeystore,
} from "@midnight-ntwrk/wallet-sdk-unshielded-wallet";
import { Buffer } from "buffer";
import * as Rx from "rxjs";
import { fromHex, toHex } from "@licensed/shared";
import { signTransactionIntents } from "./transaction-intents";

export const DEV_ENDPOINTS = {
  networkId: "undeployed",
  indexer: "http://127.0.0.1:8088/api/v4/graphql",
  indexerWS: "ws://127.0.0.1:8088/api/v4/graphql/ws",
  node: "http://127.0.0.1:9944",
  proofServer: "http://127.0.0.1:6300",
} as const;

/** Genesis-funded seed on the standalone chain (index 0 of the testkit list; the Node tests use …0001). */
export const DEV_WALLET_SEED = import.meta.env.VITE_DEV_WALLET_SEED ?? "0000000000000000000000000000000000000000000000000000000000000002";

export type DevWalletStatus =
  | { phase: "idle" }
  | { phase: "syncing"; detail: string }
  | { phase: "funding"; detail: string }
  | { phase: "ready"; night: bigint; dust: bigint }
  | { phase: "error"; detail: string };

export const devWalletStatus$ = new Rx.BehaviorSubject<DevWalletStatus>({ phase: "idle" });

type Ctx = {
  wallet: WalletFacade;
  shieldedSecretKeys: ledger.ZswapSecretKeys;
  dustSecretKey: ledger.DustSecretKey;
  unshieldedKeystore: UnshieldedKeystore;
};

let ctxPromise: Promise<Ctx> | undefined;

const buildWallet = async (seedHex: string): Promise<Ctx> => {
  devWalletStatus$.next({ phase: "syncing", detail: "deriving keys" });
  const hd = HDWallet.fromSeed(Buffer.from(seedHex, "hex"));
  if (hd.type !== "seedOk") throw new Error("Failed to initialise HDWallet from seed");
  const derived = hd.hdWallet.selectAccount(0).selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust]).deriveKeysAt(0);
  if (derived.type !== "keysDerived") throw new Error("Failed to derive wallet keys");
  hd.hdWallet.clear();
  const keys = derived.keys;

  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], DEV_ENDPOINTS.networkId as never);

  const indexerClientConnection = { indexerHttpUrl: DEV_ENDPOINTS.indexer, indexerWsUrl: DEV_ENDPOINTS.indexerWS };
  const relayURL = new URL(DEV_ENDPOINTS.node.replace(/^http/, "ws"));
  const provingServerUrl = new URL(DEV_ENDPOINTS.proofServer);
  const shieldedConfig = { networkId: DEV_ENDPOINTS.networkId, indexerClientConnection, provingServerUrl, relayURL };
  const unshieldedConfig = {
    networkId: DEV_ENDPOINTS.networkId,
    indexerClientConnection,
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
  };
  const dustConfig = {
    networkId: DEV_ENDPOINTS.networkId,
    costParameters: { additionalFeeOverhead: 300_000_000_000_000n, feeBlocksMargin: 5 },
    indexerClientConnection,
    provingServerUrl,
    relayURL,
  };

  const shieldedWallet = ShieldedWallet(shieldedConfig as never).startWithSecretKeys(shieldedSecretKeys);
  const unshieldedWallet = UnshieldedWallet(unshieldedConfig as never).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore));
  const dustWallet = DustWallet(dustConfig as never).startWithSecretKey(dustSecretKey, ledger.LedgerParameters.initialParameters().dust);

  const wallet = await WalletFacade.init({
    configuration: { ...shieldedConfig, ...unshieldedConfig, ...dustConfig } as never,
    shielded: async () => shieldedWallet as never,
    unshielded: async () => unshieldedWallet as never,
    dust: async () => dustWallet as never,
  });
  await wallet.start(shieldedSecretKeys, dustSecretKey);

  devWalletStatus$.next({ phase: "syncing", detail: "syncing standalone chain" });
  await wallet.waitForSyncedState();

  devWalletStatus$.next({ phase: "funding", detail: "waiting for NIGHT" });
  const nightToken = ledger.unshieldedToken().raw;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nightOf = (s: any): bigint => (s.unshielded.balances[nightToken] as bigint | undefined) ?? 0n;
  await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => nightOf(s) > 0n)));

  // Register NIGHT for DUST generation if needed, then wait for a positive DUST balance.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const synced: any = await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => s.isSynced)));
  if (synced.dust.availableCoins.length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const utxos = synced.unshielded.availableCoins.filter((c: any) => c.meta?.registeredForDustGeneration !== true);
    if (utxos.length > 0) {
      devWalletStatus$.next({ phase: "funding", detail: "registering NIGHT for DUST generation" });
      const recipe = await wallet.registerNightUtxosForDustGeneration(utxos, unshieldedKeystore.getPublicKey(), (p) => unshieldedKeystore.signData(p));
      const finalized = await wallet.finalizeRecipe(recipe);
      await wallet.submitTransaction(finalized);
    }
  }
  devWalletStatus$.next({ phase: "funding", detail: "waiting for DUST" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const funded: any = await Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(2_000),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Rx.filter((s: any) => s.dust.balance(new Date()) > 0n),
    ),
  );
  devWalletStatus$.next({ phase: "ready", night: nightOf(funded), dust: funded.dust.balance(new Date()) });
  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
};

const getCtx = (): Promise<Ctx> => {
  if (!ctxPromise) {
    ctxPromise = buildWallet(DEV_WALLET_SEED).catch((e) => {
      devWalletStatus$.next({ phase: "error", detail: e instanceof Error ? e.message : String(e) });
      ctxPromise = undefined;
      throw e;
    });
  }
  return ctxPromise;
};

const kmpAsZkConfigProvider = (kmp: KeyMaterialProvider): ZKConfigProvider<string> =>
  ({
    getZKIR: (id: string) => kmp.getZKIR(id),
    getProverKey: (id: string) => kmp.getProverKey(id),
    getVerifierKey: (id: string) => kmp.getVerifierKey(id),
    getVerifierKeys: async (ids: string[]) => Promise.all(ids.map(async (id) => [id, await kmp.getVerifierKey(id)] as [string, Uint8Array])),
    async get(id: string) {
      const [zkir, proverKey, verifierKey] = await Promise.all([kmp.getZKIR(id), kmp.getProverKey(id), kmp.getVerifierKey(id)]);
      return { circuitId: id, zkir, proverKey, verifierKey };
    },
    asKeyMaterialProvider: () => kmp,
  }) as unknown as ZKConfigProvider<string>;

const notImplemented = (name: string) => async (): Promise<never> => {
  throw new Error(`${name} is not implemented by the dev standalone wallet`);
};

const makeConnectedApi = (ctx: Ctx): ConnectedAPI => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state = async (): Promise<any> => Rx.firstValueFrom(ctx.wallet.state().pipe(Rx.filter((s) => s.isSynced)));
  const api = {
    getConfiguration: async () => ({
      indexerUri: DEV_ENDPOINTS.indexer,
      indexerWsUri: DEV_ENDPOINTS.indexerWS,
      proverServerUri: DEV_ENDPOINTS.proofServer,
      substrateNodeUri: DEV_ENDPOINTS.node,
      networkId: DEV_ENDPOINTS.networkId,
    }),
    getConnectionStatus: async () => ({ status: "connected" as const, networkId: DEV_ENDPOINTS.networkId }),
    getShieldedAddresses: async () => {
      const s = await state();
      return {
        shieldedAddress: String(s.shielded.address ?? ""),
        shieldedCoinPublicKey: s.shielded.coinPublicKey.toHexString(),
        shieldedEncryptionPublicKey: s.shielded.encryptionPublicKey.toHexString(),
      };
    },
    getUnshieldedAddress: async () => ({ unshieldedAddress: ctx.unshieldedKeystore.getBech32Address().toString() }),
    getDustAddress: async () => ({ dustAddress: "" }),
    getDustBalance: async () => {
      const s = await state();
      return { balance: s.dust.balance(new Date()) as bigint, cap: 0n };
    },
    getUnshieldedBalances: async () => (await state()).unshielded.balances,
    getShieldedBalances: async () => (await state()).shielded.balances,
    balanceUnsealedTransaction: async (txHex: string, options?: { payFees?: boolean }) => {
      const unbound = ledger.Transaction.deserialize<ledger.SignatureEnabled, ledger.Proof, ledger.PreBinding>(
        "signature",
        "proof",
        "pre-binding",
        fromHex(txHex),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recipe: any = await ctx.wallet.balanceUnboundTransaction(
        unbound as never,
        { shieldedSecretKeys: ctx.shieldedSecretKeys, dustSecretKey: ctx.dustSecretKey },
        { ttl: new Date(Date.now() + 60 * 60 * 1000), ...(options?.payFees === false ? { tokenKindsToBalance: ["shielded", "unshielded"] } : {}) } as never,
      );
      const signFn = (p: Uint8Array) => ctx.unshieldedKeystore.signData(p);
      signTransactionIntents(recipe.baseTransaction, signFn, "proof");
      if (recipe.balancingTransaction) signTransactionIntents(recipe.balancingTransaction, signFn, "pre-proof");
      const finalized = await ctx.wallet.finalizeRecipe(recipe);
      return { tx: toHex(finalized.serialize()) };
    },
    submitTransaction: async (txHex: string) => {
      const finalized = ledger.Transaction.deserialize<ledger.SignatureEnabled, ledger.Proof, ledger.Binding>(
        "signature",
        "proof",
        "binding",
        fromHex(txHex),
      );
      await ctx.wallet.submitTransaction(finalized);
    },
    getProvingProvider: async (kmp: KeyMaterialProvider) => httpClientProvingProvider(DEV_ENDPOINTS.proofServer, kmpAsZkConfigProvider(kmp)),
    balanceSealedTransaction: notImplemented("balanceSealedTransaction"),
    makeTransfer: notImplemented("makeTransfer"),
    makeIntent: notImplemented("makeIntent"),
    signData: notImplemented("signData"),
    getTxHistory: notImplemented("getTxHistory"),
    hintUsage: async () => {},
  };
  return api as unknown as ConnectedAPI;
};

/** Registers the shim under window.midnight so the normal wallet discovery finds it. */
export const installDevWallet = (): void => {
  if (typeof window === "undefined") return;
  const initial: InitialAPI = {
    rdns: "dev.standalone",
    name: "Dev Standalone Wallet",
    icon: "",
    apiVersion: "4.0.0",
    connect: async (_networkId: string) => makeConnectedApi(await getCtx()),
  };
  window.midnight = { ...(window.midnight ?? {}), "dev-standalone": initial };
  console.info("[licensed] dev standalone wallet installed as window.midnight['dev-standalone']");
};

/** Start syncing early so the first transaction does not wait for the whole bring-up. */
export const warmDevWallet = (): void => {
  void getCtx().catch(() => {});
};
