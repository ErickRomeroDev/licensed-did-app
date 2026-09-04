export * as LicenseRegistry from "./managed/license-registry/contract/index.js";
export {
  Contract,
  ledger,
  pureCircuits,
  StatusType,
} from "./managed/license-registry/contract/index.js";
export type {
  HolderKeyBinding,
  Ledger,
  LicenseClaims,
  LicenseCredential,
  PresentationRequest,
  RegistryBoundStatusBinding,
  Schnorr_SchnorrSignature,
  StatusRegistryRef,
  VerificationMethodRef,
  VerificationRecord,
  Witnesses,
} from "./managed/license-registry/contract/index.js";
export * from "./witnesses.js";
export * from "./constants.js";
