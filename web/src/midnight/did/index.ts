// Browser port of the midnight-did API orchestration (the published API package is Node-only).
// Uses the published 0.5.0 contract / resolver / domain / signer packages, midnight-js 4.0.2 and the wallet session.
import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { MidnightDIDResolver, type MidnightDIDDocument } from "@midnight-ntwrk/midnight-did";
import { DIDContract, witnesses as didWitnesses, type DIDPrivateState } from "@midnight-ntwrk/midnight-did-contract";
import { createMidnightDIDString, MidnightNetwork, parseContractAddress } from "@midnight-ntwrk/midnight-did-domain";
import { signJubjubDigestFromSeed } from "@midnight-ntwrk/midnight-did-jubjub-schnorr";
import { deployContract, findDeployedContract, type DeployedContract, type FoundContract } from "@midnight-ntwrk/midnight-js-contracts";
import type { MidnightProviders, PublicDataProvider } from "@midnight-ntwrk/midnight-js-types";
import type { JubjubPoint } from "@midnight-ntwrk/compact-runtime";
import { ISSUER_METHOD_ID_TEXT } from "@licensed/contract";
import { digest4, randomBytes } from "@licensed/shared";
import { zkAssetsBaseUrl } from "../zk-config-provider";

export type DidContract = InstanceType<typeof DIDContract.Contract>;
export type DidHandle = DeployedContract<DidContract> | FoundContract<DidContract>;
export type DidLedger = DIDContract.Ledger;
export const DID_PRIVATE_STATE_ID = "midnightDIDPrivateState";
export type DidProviders = MidnightProviders<string, typeof DID_PRIVATE_STATE_ID, DIDPrivateState>;

let compiled: unknown;
export const didCompiledContract = () => {
  if (!compiled) {
    compiled = CompiledContract.make("did", DIDContract.Contract as never).pipe(
      CompiledContract.withWitnesses(didWitnesses as never),
      CompiledContract.withCompiledFileAssets(zkAssetsBaseUrl("did")),
    );
  }
  return compiled as never;
};

/** midnight-js network id ("undeployed" | "preprod" | …) → did:midnight network segment enum. */
export const toMidnightNetwork = (networkId: string): MidnightNetwork => {
  const match = Object.values(MidnightNetwork).find((v) => v.toLowerCase() === networkId.toLowerCase());
  if (!match) throw new Error(`Unknown Midnight network id: ${networkId}`);
  return match;
};

export const didStringFor = (contractAddress: string, networkId: string): string =>
  createMidnightDIDString(parseContractAddress(contractAddress), toMidnightNetwork(networkId));

export const newDidPrivateState = (): { secretKey: Uint8Array; recoverySecretKey: Uint8Array } => ({
  secretKey: randomBytes(32),
  recoverySecretKey: randomBytes(32),
});

/** Step 1 of the board wizard: deploy the did:midnight contract (controller + recovery keys from witnesses). */
export const createDid = async (providers: DidProviders, privateState: DIDPrivateState): Promise<{ handle: DidHandle; address: string }> => {
  const handle = (await deployContract(providers as never, {
    compiledContract: didCompiledContract(),
    privateStateId: DID_PRIVATE_STATE_ID,
    initialPrivateState: privateState,
  } as never)) as unknown as DeployedContract<DidContract>;
  return { handle, address: handle.deployTxData.public.contractAddress };
};

export const joinDid = async (providers: DidProviders, address: string, privateState: DIDPrivateState): Promise<DidHandle> =>
  (await findDeployedContract(providers as never, {
    contractAddress: address,
    compiledContract: didCompiledContract(),
    privateStateId: DID_PRIVATE_STATE_ID,
    initialPrivateState: privateState,
  } as never)) as unknown as FoundContract<DidContract>;

export const readDidLedger = async (publicData: PublicDataProvider, address: string): Promise<DidLedger | null> => {
  const cs = await publicData.queryContractState(address);
  return cs ? DIDContract.ledger(cs.data) : null;
};

const requireDidLedger = async (publicData: PublicDataProvider, address: string): Promise<DidLedger> => {
  const L = await readDidLedger(publicData, address);
  if (!L) throw new Error(`No DID contract at ${address}`);
  return L;
};

/** Absolute, subject-bound method id as required by the method spec for new writes. */
export const issuerMethodIdFor = (address: string, networkId: string): string =>
  `${didStringFor(address, networkId)}${ISSUER_METHOD_ID_TEXT}`;

/** Step 2: publish the board's Jubjub signing key as a Schnorr-Jubjub verification method (#key-assert). */
export const addAssertKey = async (args: {
  handle: DidHandle;
  providers: DidProviders;
  address: string;
  networkId: string;
  controllerSecret: Uint8Array;
  publicKey: JubjubPoint;
}): Promise<string> => {
  const L = await requireDidLedger(args.providers.publicDataProvider, args.address);
  const method: DIDContract.SchnorrJubjubVerificationMethod = { id: issuerMethodIdFor(args.address, args.networkId), publicKey: args.publicKey };
  const digest = digest4(
    DIDContract.pureCircuits.setSchnorrJubjubVerificationMethodAuthorizationDigest(L.id, L.version, method, DIDContract.MapMutation.Insert),
  );
  const signature = signJubjubDigestFromSeed(args.controllerSecret, digest);
  const result = await args.handle.callTx.setSchnorrJubjubVerificationMethod(method, DIDContract.MapMutation.Insert, signature, L.version);
  return result.public.txHash;
};

/** Step 3: mark #key-assert as an assertionMethod. */
export const addAssertionRelation = async (args: {
  handle: DidHandle;
  providers: DidProviders;
  address: string;
  networkId: string;
  controllerSecret: Uint8Array;
}): Promise<string> => {
  const L = await requireDidLedger(args.providers.publicDataProvider, args.address);
  const methodId = issuerMethodIdFor(args.address, args.networkId);
  const relation = DIDContract.VerificationMethodRelation.AssertionMethod;
  const digest = digest4(
    DIDContract.pureCircuits.setVerificationMethodRelationAuthorizationDigest(L.id, L.version, relation, methodId, DIDContract.SetMutation.Insert),
  );
  const signature = signJubjubDigestFromSeed(args.controllerSecret, digest);
  const result = await args.handle.callTx.setVerificationMethodRelation(relation, methodId, DIDContract.SetMutation.Insert, signature, L.version);
  return result.public.txHash;
};

/** In-browser resolver over the indexer (reference implementation's MidnightDIDResolver with an injected ledger reader). */
export const resolveDid = async (publicData: PublicDataProvider, did: string, networkId: string): Promise<MidnightDIDDocument> => {
  const resolver = new MidnightDIDResolver({
    expectedNetwork: toMidnightNetwork(networkId),
    ledgerReader: async (contractAddress: string) => readDidLedger(publicData, contractAddress),
  });
  return resolver.resolve(did);
};
