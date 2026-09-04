import type {
  LicenseClaims,
  LicenseCredential,
  PresentationRequest,
  Schnorr_SchnorrSignature,
} from "@licensed/contract";
import type { JubjubPoint } from "@midnight-ntwrk/compact-runtime";

export type { LicenseClaims, LicenseCredential, PresentationRequest, Schnorr_SchnorrSignature, JubjubPoint };

/** Human-entered licence data (board form). Days are days since the Unix epoch. */
export type LicenseInput = {
  category: number;
  jurisdiction: string;
  licenseNumber: string;
  holderName: string;
  issuedAtDay: number;
  expiresAtDay: number;
};

/** Practitioner identity: a Jubjub key pair and the offchain long-form did:midnight derived from it. */
export type HolderIdentity = {
  secretScalar: bigint;
  publicKey: JubjubPoint;
  did: string;
};

/** Everything the practitioner keeps after issuance. Never sent to a verifier. */
export type HeldLicense = {
  credential: LicenseCredential;
  claims: LicenseClaims;
  claimsOpening: Uint8Array;
  issuerSignature: Schnorr_SchnorrSignature;
  leafIndex: bigint;
  registryAddress: string;
  issuerDid: string;
  boardName: string;
  receivedAt: number;
};

export type BoardLicenseRecord = {
  licenseNumber: string;
  holderName: string;
  holderDid: string;
  category: number;
  jurisdiction: string;
  issuedAtDay: number;
  expiresAtDay: number;
  leafIndex: bigint;
  statusHandleCommitment: Uint8Array;
  revoked: boolean;
  issuedTxHash?: string;
  revokedTxHash?: string;
};

/** The board's browser-persisted back office (exportable as one JSON file — demo convenience, not custody). */
export type BoardState = {
  version: 1;
  network: string;
  boardName: string;
  didContractAddress: string;
  didControllerSecret: Uint8Array;
  didRecoverySecret: Uint8Array;
  issuerSecretScalar: bigint;
  registryAddress: string;
  licenses: BoardLicenseRecord[];
};

/** What the verifier hands to the practitioner (copy/paste or QR). */
export type PresentationRequestWire = {
  version: 1;
  registryAddress: string;
  challenge: Uint8Array;
  requiredCategory: number;
  currentDay: number;
  verifierName: string;
};

/** What the board hands to the practitioner after issuance (copy/paste or same-browser delivery). */
export type LicenseBundleWire = {
  version: 1;
  license: HeldLicense;
};
