// End-to-end lifecycle on the local standalone stack (infra/standalone.yml), driven by the reference
// implementation's headless wallet. This is the protocol proof independent of the browser:
//   board DID (deploy + #key-assert + assertionMethod) → LicenseRegistry deploy → issue → present (holder, no
//   issuer secret) → revoke → present fails; another holder unaffected.
//
// Requires: docker compose -f infra/standalone.yml up -d ; pnpm --filter @licensed/contract compact
import { CompiledContract } from "@midnight-ntwrk/compact-js";
import * as api from "@midnight-ntwrk/midnight-did-api";
import { VerificationMethodRelationType } from "@midnight-ntwrk/midnight-did-domain";
import { deployContract, findDeployedContract, type DeployedContract, type FoundContract } from "@midnight-ntwrk/midnight-js-contracts";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import type { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import pino from "pino";
import { beforeAll, describe, expect, it } from "vitest";
import {
  Contract,
  ISSUER_METHOD_ID,
  ISSUER_METHOD_ID_TEXT,
  ledger,
  witnesses,
  type Ledger,
  type LicenseCredential,
  type RegistryPrivateState,
  type Schnorr_SchnorrSignature,
} from "@licensed/contract";
import {
  buildCredential,
  claimsFromInput,
  commitClaims,
  fromHex,
  holderDidFromKey,
  holderKeyFromDid,
  jubjubPointToJwk,
  newStatusHandle,
  publicKeyOf,
  randomBytes,
  randomScalar,
  signCredential,
  signPresentation,
  toHex,
  todayDays,
  type LicenseClaims,
} from "@licensed/shared";
import { inMemoryPrivateStateProvider } from "./in-memory-private-state-provider.js";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });
api.setLogger(logger);

const GENESIS_SEED = "0000000000000000000000000000000000000000000000000000000000000001";
const REGISTRY_ZK_PATH = process.env.LICENSED_REGISTRY_ZK_PATH!;
const ISSUER_PS_ID = "licensedRegistryIssuer";
const HOLDER_PS_ID = "licensedRegistryHolder";

type RegistryContract = Contract<RegistryPrivateState>;
type RegistryProviders = MidnightProviders<"issue" | "revoke" | "present", string, RegistryPrivateState>;

const registryCompiled = CompiledContract.make("license-registry", Contract as never).pipe(
  CompiledContract.withWitnesses(witnesses as never),
  CompiledContract.withCompiledFileAssets(REGISTRY_ZK_PATH),
) as unknown as CompiledContract.CompiledContract<RegistryContract, RegistryPrivateState>;

const timed = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
  const t0 = Date.now();
  const out = await fn();
  logger.info({ ms: Date.now() - t0 }, `⏱ ${label}`);
  return out;
};

const withDustRetry = async <T>(fn: () => Promise<T>, retries = 3, delayMs = 8_000): Promise<T> => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (attempt >= retries || !/Not enough Dust|could not balance dust|Insufficient.*dust/i.test(msg)) throw e;
      logger.warn(`dust not ready (${msg}); retrying in ${delayMs}ms`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
};

describe("Licensed lifecycle on standalone", () => {
  const config = new api.StandaloneConfig();
  let walletCtx: api.MidnightDIDWalletContext;
  let didProviders: Awaited<ReturnType<typeof api.configureProviders>>;
  let didContract: Awaited<ReturnType<typeof api.createDID>>;
  let didAddress: string;
  let issuerScalar: bigint;
  let issuerProviders: RegistryProviders;
  let holderProviders: RegistryProviders;
  let registryAddress: string;
  let registryLedger: () => Promise<Ledger>;

  const holderScalar = randomScalar();
  const holderDid = holderDidFromKey(publicKeyOf(holderScalar));
  const today = BigInt(todayDays());

  type Issued = {
    claims: LicenseClaims;
    opening: Uint8Array;
    credential: LicenseCredential;
    issuerSignature: Schnorr_SchnorrSignature;
    leafIndex: bigint;
    holderScalar: bigint;
  };
  let alice: Issued;

  beforeAll(async () => {
    walletCtx = await timed("wallet sync + funds", () => api.buildWalletAndWaitForFunds(config, GENESIS_SEED));
    await timed("dust registration", () => api.registerForDustGeneration(walletCtx.wallet, walletCtx.unshieldedKeystore));
    didProviders = await api.configureProviders(walletCtx, config);
    issuerScalar = randomScalar();

    const walletAndMidnight = await api.createWalletAndMidnightProvider(walletCtx);
    const zk = new NodeZkConfigProvider<"issue" | "revoke" | "present">(REGISTRY_ZK_PATH);
    const shared = {
      publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
      zkConfigProvider: zk,
      proofProvider: httpClientProofProvider(config.proofServer, zk),
      walletProvider: walletAndMidnight,
      midnightProvider: walletAndMidnight,
    };
    issuerProviders = { ...shared, privateStateProvider: inMemoryPrivateStateProvider() } as RegistryProviders;
    holderProviders = { ...shared, privateStateProvider: inMemoryPrivateStateProvider() } as RegistryProviders;
    registryLedger = async () => {
      const cs = await shared.publicDataProvider.queryContractState(registryAddress);
      if (!cs) throw new Error("registry state not found");
      return ledger(cs.data);
    };
  });

  it("creates the board DID and publishes #key-assert as an assertionMethod (reference implementation)", async () => {
    const privateState = await api.initPrivateState(didProviders);
    didContract = await timed("createDID", () => withDustRetry(() => api.createDID(didProviders, privateState)));
    didAddress = didContract.deployTxData.public.contractAddress;
    logger.info({ didAddress }, "DID contract deployed");

    const issuerPk = publicKeyOf(issuerScalar);
    await timed("addSchnorrJubjubVerificationMethod", () =>
      withDustRetry(() => api.addSchnorrJubjubVerificationMethod(didContract, didProviders, { id: ISSUER_METHOD_ID_TEXT, publicKey: issuerPk })),
    );
    await timed("addVerificationMethodRelation(assertionMethod)", () =>
      withDustRetry(() => api.addVerificationMethodRelation(didContract, didProviders, VerificationMethodRelationType.AssertionMethod, ISSUER_METHOD_ID_TEXT)),
    );

    const resolved = await api.resolve(didProviders, didContract);
    expect(resolved).not.toBeNull();
    const doc = resolved!.didDocument;
    logger.info({ did: doc.id }, "resolved board DID");
    expect(doc.id.startsWith("did:midnight:undeployed:")).toBe(true);
    const method = doc.verificationMethod?.find((m) => m.id.endsWith(ISSUER_METHOD_ID_TEXT));
    expect(method).toBeDefined();
    expect(method!.publicKeyJwk).toMatchObject(jubjubPointToJwk(issuerPk));
    expect((doc.assertionMethod ?? []).some((m) => String(m).endsWith(ISSUER_METHOD_ID_TEXT))).toBe(true);
  });

  it("deploys the LicenseRegistry sealed to the board DID and its #key-assert key", async () => {
    const deployed = (await timed("deploy LicenseRegistry", () =>
      withDustRetry(() =>
        deployContract(issuerProviders as never, {
          compiledContract: registryCompiled as never,
          privateStateId: ISSUER_PS_ID,
          initialPrivateState: { issuerSecretScalar: issuerScalar },
          args: [{ bytes: fromHex(didAddress) }, ISSUER_METHOD_ID],
        } as never),
      ),
    )) as unknown as DeployedContract<RegistryContract>;
    registryAddress = deployed.deployTxData.public.contractAddress;
    logger.info({ registryAddress }, "LicenseRegistry deployed");

    const L = await registryLedger();
    expect(L.issuerPublicKey).toEqual(publicKeyOf(issuerScalar));
    expect(toHex(L.issuerDidContract.bytes)).toBe(didAddress.toLowerCase());
    expect(L.issuerMethodId).toEqual(ISSUER_METHOD_ID);
    expect(L.issuedCount).toBe(0n);
    expect(L.registryId).toHaveLength(32);
  });

  const issueTo = async (scalar: bigint, licenseNumber: string, name: string): Promise<Issued> => {
    const registry = (await findDeployedContract(issuerProviders as never, {
      contractAddress: registryAddress,
      compiledContract: registryCompiled as never,
      privateStateId: ISSUER_PS_ID,
      initialPrivateState: { issuerSecretScalar: issuerScalar },
    } as never)) as unknown as FoundContract<RegistryContract>;
    const claims = claimsFromInput({
      category: 1,
      jurisdiction: "CA",
      licenseNumber,
      holderName: name,
      issuedAtDay: Number(today) - 300,
      expiresAtDay: Number(today) + 700,
    });
    const opening = randomBytes(32);
    const handle = newStatusHandle();
    const before = await registryLedger();
    const leafIndex = before.issuedCount;
    await timed(`issue(${licenseNumber})`, () =>
      withDustRetry(() => registry.callTx.issue(handle.commitment)),
    );
    const L = await registryLedger();
    expect(L.issuedCount).toBe(leafIndex + 1n);
    const credential = buildCredential({
      didContractAddress: didAddress,
      registryId: L.registryId,
      holderPublicKey: publicKeyOf(scalar),
      claimsCommitment: commitClaims(claims, opening),
      statusHandleCommitment: handle.commitment,
    });
    return { claims, opening, credential, issuerSignature: signCredential(issuerScalar, credential), leafIndex, holderScalar: scalar };
  };

  const presentAs = async (lic: Issued, requiredCategory = 1n) => {
    // The holder joins the registry with NO issuer secret in its private state.
    const registry = (await findDeployedContract(holderProviders as never, {
      contractAddress: registryAddress,
      compiledContract: registryCompiled as never,
      privateStateId: HOLDER_PS_ID,
      initialPrivateState: {},
    } as never)) as unknown as FoundContract<RegistryContract>;
    const L = await registryLedger();
    const path = L.activeLicenses.pathForLeaf(lic.leafIndex, lic.credential.statusBinding.statusHandleCommitment);
    const request = { challenge: randomBytes(32), requiredCategory, currentDay: today };
    const holderSignature = signPresentation(lic.holderScalar, request, L.registryId);
    const tx = await timed("present", () =>
      withDustRetry(() =>
        registry.callTx.present(
          lic.credential,
          lic.issuerSignature,
          lic.claims,
          lic.opening,
          path,
          holderSignature,
          request,
        ),
      ),
    );
    return { request, txHash: tx.public.txHash };
  };

  it("issues a licence to the practitioner's offchain DID", async () => {
    expect(holderKeyFromDid(holderDid)).toEqual(publicKeyOf(holderScalar));
    alice = await issueTo(holderScalar, "CA-4471", "Ada Lovelace");
    expect(alice.leafIndex).toBe(0n);
  });

  it("verifier sees the presentation on-chain without contacting the board", async () => {
    const { request, txHash } = await presentAs(alice);
    logger.info({ txHash }, "presentation finalized");
    const L = await registryLedger();
    expect(L.verifications.member(request.challenge)).toBe(true);
    expect(L.verifications.lookup(request.challenge)).toEqual({ category: 1n, currentDay: today });
  });

  it("revocation flips the root; the practitioner can no longer prove; another holder is unaffected", async () => {
    const bobScalar = randomScalar();
    const bob = await issueTo(bobScalar, "CA-9000", "Bob Builder");

    const registry = (await findDeployedContract(issuerProviders as never, {
      contractAddress: registryAddress,
      compiledContract: registryCompiled as never,
      privateStateId: ISSUER_PS_ID,
      initialPrivateState: { issuerSecretScalar: issuerScalar },
    } as never)) as unknown as FoundContract<RegistryContract>;
    const rootBefore = (await registryLedger()).activeLicenses.root();
    await timed("revoke(alice)", () =>
      withDustRetry(() => registry.callTx.revoke(alice.leafIndex)),
    );
    const L = await registryLedger();
    expect(L.revokedCount).toBe(1n);
    expect(L.activeLicenses.root()).not.toEqual(rootBefore);
    expect(L.activeLicenses.findPathForLeaf(alice.credential.statusBinding.statusHandleCommitment)).toBeUndefined();

    // Alice cannot build a valid proof any more: the circuit rejects locally before anything reaches the chain.
    const holderRegistry = (await findDeployedContract(holderProviders as never, {
      contractAddress: registryAddress,
      compiledContract: registryCompiled as never,
      privateStateId: HOLDER_PS_ID,
      initialPrivateState: {},
    } as never)) as unknown as FoundContract<RegistryContract>;
    const stalePath = { leaf: alice.credential.statusBinding.statusHandleCommitment, path: L.activeLicenses.pathForLeaf(alice.leafIndex, new Uint8Array(32)).path };
    const request = { challenge: randomBytes(32), requiredCategory: 1n, currentDay: today };
    await expect(
      holderRegistry.callTx.present(
        alice.credential,
        alice.issuerSignature,
        alice.claims,
        alice.opening,
        stalePath,
        signPresentation(alice.holderScalar, request, L.registryId),
        request,
      ),
    ).rejects.toThrow(/revoked or unknown/);
    expect((await registryLedger()).verifications.member(request.challenge)).toBe(false);

    // Bob still presents fine under the new root.
    const bobResult = await presentAs(bob);
    expect((await registryLedger()).verifications.member(bobResult.request.challenge)).toBe(true);
  });
});
