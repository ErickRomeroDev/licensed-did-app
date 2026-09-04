// Credential construction, signing and verification. All hashing goes through the contract's
// exported pure circuits so TypeScript and the circuit can never disagree.
import {
  CREDENTIAL_VERSION,
  ISSUER_METHOD_ID,
  pad32,
  padBytes,
  pureCircuits,
  SCHEMA_ID,
  StatusType,
  type LicenseClaims,
  type LicenseCredential,
  type PresentationRequest,
  type Schnorr_SchnorrSignature,
  type VerificationMethodRef,
} from "@licensed/contract";
import type { JubjubPoint } from "@midnight-ntwrk/compact-runtime";
import {
  deriveJubjubPublicKey,
  JUBJUB_ORDER,
  signJubjubDigest,
  verifyJubjubDigest,
} from "@midnight-ntwrk/midnight-did-jubjub-schnorr";
import { fromHex } from "./codec.js";
import type { LicenseInput } from "./types.js";

export type Digest4 = [bigint, bigint, bigint, bigint];

export const randomBytes = (n: number): Uint8Array => {
  const out = new Uint8Array(n);
  globalThis.crypto.getRandomValues(out);
  return out;
};

/** Uniform-ish random Jubjub scalar in [1, order-1]. */
export const randomScalar = (): bigint => {
  let x = 0n;
  for (const b of randomBytes(40)) x = (x << 8n) | BigInt(b);
  return (x % (JUBJUB_ORDER - 1n)) + 1n;
};

export const publicKeyOf = (secretScalar: bigint): JubjubPoint => deriveJubjubPublicKey(secretScalar);

export const digest4 = (v: readonly bigint[]): Digest4 => {
  if (v.length !== 4) throw new Error("digest must have exactly 4 field elements");
  return [v[0]!, v[1]!, v[2]!, v[3]!];
};

export const claimsFromInput = (input: LicenseInput): LicenseClaims => ({
  category: BigInt(input.category),
  jurisdiction: pad32(input.jurisdiction),
  licenseNumber: pad32(input.licenseNumber),
  holderName: padBytes(input.holderName, 64),
  issuedAtDay: BigInt(input.issuedAtDay),
  expiresAtDay: BigInt(input.expiresAtDay),
});

export const issuerRefFor = (didContractAddress: string): VerificationMethodRef => ({
  didContractAddress: { bytes: fromHex(didContractAddress) },
  methodId: ISSUER_METHOD_ID,
});

export const commitClaims = (claims: LicenseClaims, opening: Uint8Array): Uint8Array =>
  pureCircuits.claimsCommitment(claims, opening);

export const newStatusHandle = (): { random: Uint8Array; commitment: Uint8Array } => {
  const random = randomBytes(32);
  return { random, commitment: pureCircuits.statusHandleCommitment(random) };
};

export const buildCredential = (args: {
  didContractAddress: string;
  registryId: Uint8Array;
  holderPublicKey: JubjubPoint;
  claimsCommitment: Uint8Array;
  statusHandleCommitment: Uint8Array;
  issuedAt?: bigint;
}): LicenseCredential => {
  const issuer = issuerRefFor(args.didContractAddress);
  return {
    version: CREDENTIAL_VERSION,
    schemaId: SCHEMA_ID,
    issuer,
    holderBinding: { holderPublicKey: args.holderPublicKey },
    statusBinding: {
      statusType: StatusType.revocationRegistry,
      registryRef: { registryId: args.registryId, authorityVerificationMethodRef: issuer },
      statusHandleCommitment: args.statusHandleCommitment,
    },
    issuedAt: args.issuedAt ?? BigInt(Date.now()),
    claimsCommitment: args.claimsCommitment,
  };
};

export const credentialDigest = (credential: LicenseCredential): Digest4 =>
  digest4(pureCircuits.credentialDigest(credential));

export const signCredential = (issuerSecretScalar: bigint, credential: LicenseCredential): Schnorr_SchnorrSignature =>
  signJubjubDigest(issuerSecretScalar, credentialDigest(credential));

export const verifyCredential = (
  issuerPublicKey: JubjubPoint,
  credential: LicenseCredential,
  signature: Schnorr_SchnorrSignature,
): boolean => verifyJubjubDigest(issuerPublicKey, credentialDigest(credential), signature);

export const presentationDigest = (request: PresentationRequest, registryId: Uint8Array): Digest4 =>
  digest4(pureCircuits.presentationDigest(request, registryId));

export const signPresentation = (
  holderSecretScalar: bigint,
  request: PresentationRequest,
  registryId: Uint8Array,
): Schnorr_SchnorrSignature => signJubjubDigest(holderSecretScalar, presentationDigest(request, registryId));
