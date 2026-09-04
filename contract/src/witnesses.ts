// Witness implementations for LicenseRegistry.
//
// `issuerSecretKey` is only consulted by the issuer-authorised circuits (constructor, issue, revoke).
// `getSchnorrReduction` is required by the vendored Schnorr module for every signature verification
// (it splits the transient-hash challenge into a quotient and a 248-bit remainder, the same way the
// midnight-did reference implementation does in packages/contract/src/witnesses.ts).
import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import type { Ledger, Witnesses } from "./managed/license-registry/contract/index.js";

export const TWO_248 = 1n << 248n;

export type RegistryPrivateState = {
  /** Jubjub secret scalar behind the registry's sealed issuerPublicKey (== the issuer DID's #key-assert). */
  readonly issuerSecretScalar?: bigint;
};

export const emptyRegistryPrivateState: RegistryPrivateState = {};

export const witnesses: Witnesses<RegistryPrivateState> = {
  issuerSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, RegistryPrivateState>): [RegistryPrivateState, bigint] => {
    if (typeof privateState.issuerSecretScalar !== "bigint") {
      throw new Error("Registry issuer secret scalar is required for this circuit");
    }
    return [privateState, privateState.issuerSecretScalar];
  },
  getSchnorrReduction: (
    { privateState }: WitnessContext<Ledger, RegistryPrivateState>,
    challengeHash: bigint,
  ): [RegistryPrivateState, [bigint, bigint]] => [
    privateState,
    [challengeHash / TWO_248, challengeHash % TWO_248],
  ],
};
