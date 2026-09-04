// LicenseRegistry client for the browser: deploy/join, issue, revoke, present, and public reads.
import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { deployContract, findDeployedContract, type DeployedContract, type FoundContract } from "@midnight-ntwrk/midnight-js-contracts";
import type { MidnightProviders, PublicDataProvider } from "@midnight-ntwrk/midnight-js-types";
import {
  Contract,
  ISSUER_METHOD_ID,
  ledger,
  witnesses,
  type Ledger,
  type LicenseClaims,
  type LicenseCredential,
  type PresentationRequest,
  type RegistryPrivateState,
  type Schnorr_SchnorrSignature,
} from "@licensed/contract";
import { fromHex, signPresentation, toHex } from "@licensed/shared";
import { zkAssetsBaseUrl } from "../zk-config-provider";

export type RegistryContract = Contract<RegistryPrivateState>;
export type RegistryHandle = DeployedContract<RegistryContract> | FoundContract<RegistryContract>;
export type RegistryCircuit = "issue" | "revoke" | "present";
export const REGISTRY_PRIVATE_STATE_ID = "licensedRegistry";
export type RegistryProviders = MidnightProviders<RegistryCircuit, typeof REGISTRY_PRIVATE_STATE_ID, RegistryPrivateState>;

let compiled: unknown;
export const registryCompiledContract = () => {
  if (!compiled) {
    compiled = CompiledContract.make("license-registry", Contract as never).pipe(
      CompiledContract.withWitnesses(witnesses as never),
      CompiledContract.withCompiledFileAssets(zkAssetsBaseUrl("license-registry")),
    );
  }
  return compiled as never;
};

export const deployRegistry = async (
  providers: RegistryProviders,
  issuerSecretScalar: bigint,
  didContractAddress: string,
): Promise<{ handle: RegistryHandle; address: string }> => {
  const handle = (await deployContract(providers as never, {
    compiledContract: registryCompiledContract(),
    privateStateId: REGISTRY_PRIVATE_STATE_ID,
    initialPrivateState: { issuerSecretScalar },
    args: [{ bytes: fromHex(didContractAddress) }, ISSUER_METHOD_ID],
  } as never)) as unknown as DeployedContract<RegistryContract>;
  return { handle, address: handle.deployTxData.public.contractAddress };
};

export const joinRegistry = async (
  providers: RegistryProviders,
  address: string,
  privateState: RegistryPrivateState,
): Promise<RegistryHandle> =>
  (await findDeployedContract(providers as never, {
    contractAddress: address,
    compiledContract: registryCompiledContract(),
    privateStateId: REGISTRY_PRIVATE_STATE_ID,
    initialPrivateState: privateState,
  } as never)) as unknown as FoundContract<RegistryContract>;

export const readRegistry = async (publicData: PublicDataProvider, address: string): Promise<Ledger | null> => {
  const cs = await publicData.queryContractState(address);
  return cs ? ledger(cs.data) : null;
};

export type RegistrySnapshot = {
  root: string;
  registryId: Uint8Array;
  issuedCount: bigint;
  revokedCount: bigint;
  issuerDidContract: string;
  verifications: Array<{ challenge: Uint8Array; category: bigint; currentDay: bigint }>;
};

export const snapshotRegistry = (L: Ledger): RegistrySnapshot => ({
  root: L.activeLicenses.root().field.toString(16).padStart(64, "0"),
  registryId: L.registryId,
  issuedCount: L.issuedCount,
  revokedCount: L.revokedCount,
  issuerDidContract: toHex(L.issuerDidContract.bytes),
  verifications: Array.from(L.verifications).map(([challenge, rec]) => ({ challenge, category: rec.category, currentDay: rec.currentDay })),
});

export type LicenseStatus = "active" | "revoked" | "unknown";

/** Public-tree check the practitioner runs to display its status chip (no wallet, no issuer contact).
 *  `findPathForLeaf` scans the current tree for the commitment; `pathForLeaf(index, leaf)` would happily build a
 *  path for a leaf that is no longer there (the circuit, not the helper, is what rejects it). */
export const licenseStatus = (L: Ledger, _leafIndex: bigint, statusHandleCommitment: Uint8Array): LicenseStatus => {
  try {
    return L.activeLicenses.findPathForLeaf(statusHandleCommitment) ? "active" : "revoked";
  } catch {
    return "unknown";
  }
};

export const issueLicense = async (handle: RegistryHandle, statusHandleCommitment: Uint8Array): Promise<string> =>
  (await handle.callTx.issue(statusHandleCommitment)).public.txHash;

export const revokeLicense = async (handle: RegistryHandle, leafIndex: bigint): Promise<string> =>
  (await handle.callTx.revoke(leafIndex)).public.txHash;

export const presentLicense = async (args: {
  handle: RegistryHandle;
  ledger: Ledger;
  credential: LicenseCredential;
  issuerSignature: Schnorr_SchnorrSignature;
  claims: LicenseClaims;
  claimsOpening: Uint8Array;
  leafIndex: bigint;
  holderSecretScalar: bigint;
  request: PresentationRequest;
}): Promise<string> => {
  const path = args.ledger.activeLicenses.pathForLeaf(args.leafIndex, args.credential.statusBinding.statusHandleCommitment);
  const holderSignature = signPresentation(args.holderSecretScalar, args.request, args.ledger.registryId);
  const result = await args.handle.callTx.present(
    args.credential,
    args.issuerSignature,
    args.claims,
    args.claimsOpening,
    path,
    holderSignature,
    args.request,
  );
  return result.public.txHash;
};
