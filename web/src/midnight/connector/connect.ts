// Wallet discovery and connection through the Midnight dApp connector (v4). Works with the 1AM extension
// (`window.midnight['1am']`) and, in dev mode, with the in-page standalone shim registered under
// `window.midnight['dev-standalone']`.
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { DEV_WALLET_KEY, PREFERRED_WALLET_RDNS, type InitialAPI, type WalletSession } from "./types";

export type DiscoveredWallet = { key: string; api: InitialAPI };

export const discoverWallets = (): DiscoveredWallet[] => {
  const out: DiscoveredWallet[] = [];
  const injected = window.midnight ?? {};
  for (const key of Object.keys(injected)) {
    const api = injected[key];
    if (!api || typeof api.connect !== "function") continue;
    out.push({ key, api });
  }
  // Prefer 1AM, then the dev shim, then anything else.
  const rank = (w: DiscoveredWallet) =>
    PREFERRED_WALLET_RDNS.some((r) => w.key === r || w.api.rdns === r || w.api.name === r) ? 0 : w.key === DEV_WALLET_KEY ? 1 : 2;
  return out.sort((a, b) => rank(a) - rank(b));
};

/** Poll for injected wallets (extensions inject asynchronously). */
export const waitForWallets = async (timeoutMs = 2_000): Promise<DiscoveredWallet[]> => {
  const started = Date.now();
  for (;;) {
    const found = discoverWallets();
    if (found.length > 0 || Date.now() - started > timeoutMs) return found;
    await new Promise((r) => setTimeout(r, 100));
  }
};

export const connectWallet = async (wallet: DiscoveredWallet, networkIdHint: string): Promise<WalletSession> => {
  const api = await wallet.api.connect(networkIdHint);
  const [configuration, status, shielded, unshielded] = await Promise.all([
    api.getConfiguration(),
    api.getConnectionStatus(),
    api.getShieldedAddresses(),
    api.getUnshieldedAddress(),
  ]);
  const networkId = status.status === "connected" ? status.networkId : configuration.networkId;
  if (!networkId) throw new Error("Wallet did not report a network id");
  if (networkIdHint && networkId !== networkIdHint) {
    throw new Error(`Wallet is on network "${networkId}", but this app expects "${networkIdHint}". Switch the wallet network and reconnect.`);
  }
  setNetworkId(networkId);
  return {
    walletName: wallet.api.name,
    rdns: wallet.api.rdns ?? wallet.key,
    networkId,
    api,
    configuration,
    shieldedCoinPublicKey: shielded.shieldedCoinPublicKey,
    shieldedEncryptionPublicKey: shielded.shieldedEncryptionPublicKey,
    unshieldedAddress: unshielded.unshieldedAddress,
  };
};
