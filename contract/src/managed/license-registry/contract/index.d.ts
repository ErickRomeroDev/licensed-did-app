import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type VerificationMethodRef = { didContractAddress: { bytes: Uint8Array };
                                      methodId: Uint8Array
                                    };

export type StatusRegistryRef = { registryId: Uint8Array;
                                  authorityVerificationMethodRef: VerificationMethodRef
                                };

export enum StatusType { none = 0, revocationRegistry = 1 }

export type RegistryBoundStatusBinding = { statusType: StatusType;
                                           registryRef: StatusRegistryRef;
                                           statusHandleCommitment: Uint8Array
                                         };

export type HolderKeyBinding = { holderPublicKey: __compactRuntime.JubjubPoint
                               };

export type LicenseClaims = { category: bigint;
                              jurisdiction: Uint8Array;
                              licenseNumber: Uint8Array;
                              holderName: Uint8Array;
                              issuedAtDay: bigint;
                              expiresAtDay: bigint
                            };

export type LicenseCredential = { version: bigint;
                                  schemaId: Uint8Array;
                                  issuer: VerificationMethodRef;
                                  holderBinding: HolderKeyBinding;
                                  statusBinding: RegistryBoundStatusBinding;
                                  issuedAt: bigint;
                                  claimsCommitment: Uint8Array
                                };

export type PresentationRequest = { challenge: Uint8Array;
                                    requiredCategory: bigint;
                                    currentDay: bigint
                                  };

export type VerificationRecord = { category: bigint; currentDay: bigint };

export type Schnorr_SchnorrSignature = { announcement: __compactRuntime.JubjubPoint;
                                         response: bigint
                                       };

export type Witnesses<PS> = {
  getSchnorrReduction(context: __compactRuntime.WitnessContext<Ledger, PS>,
                      challengeHash_0: bigint): [PS, [bigint, bigint]];
  issuerSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
}

export type ImpureCircuits<PS> = {
  issue(context: __compactRuntime.CircuitContext<PS>,
        statusHandleCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revoke(context: __compactRuntime.CircuitContext<PS>, index_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  present(context: __compactRuntime.CircuitContext<PS>,
          credential_0: LicenseCredential,
          issuerSignature_0: Schnorr_SchnorrSignature,
          claims_0: LicenseClaims,
          claimsOpening_0: Uint8Array,
          statusPath_0: { leaf: Uint8Array,
                          path: { sibling: { field: bigint }, goes_left: boolean
                                }[]
                        },
          holderSignature_0: Schnorr_SchnorrSignature,
          request_0: PresentationRequest): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  issue(context: __compactRuntime.CircuitContext<PS>,
        statusHandleCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revoke(context: __compactRuntime.CircuitContext<PS>, index_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  present(context: __compactRuntime.CircuitContext<PS>,
          credential_0: LicenseCredential,
          issuerSignature_0: Schnorr_SchnorrSignature,
          claims_0: LicenseClaims,
          claimsOpening_0: Uint8Array,
          statusPath_0: { leaf: Uint8Array,
                          path: { sibling: { field: bigint }, goes_left: boolean
                                }[]
                        },
          holderSignature_0: Schnorr_SchnorrSignature,
          request_0: PresentationRequest): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  credentialDigest(credential_0: LicenseCredential): bigint[];
  presentationDigest(request_0: PresentationRequest, registry_0: Uint8Array): bigint[];
  claimsCommitment(claims_0: LicenseClaims, opening_0: Uint8Array): Uint8Array;
  statusHandleCommitment(random_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  credentialDigest(context: __compactRuntime.CircuitContext<PS>,
                   credential_0: LicenseCredential): __compactRuntime.CircuitResults<PS, bigint[]>;
  presentationDigest(context: __compactRuntime.CircuitContext<PS>,
                     request_0: PresentationRequest,
                     registry_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint[]>;
  claimsCommitment(context: __compactRuntime.CircuitContext<PS>,
                   claims_0: LicenseClaims,
                   opening_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  statusHandleCommitment(context: __compactRuntime.CircuitContext<PS>,
                         random_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  issue(context: __compactRuntime.CircuitContext<PS>,
        statusHandleCommitment_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  revoke(context: __compactRuntime.CircuitContext<PS>, index_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  present(context: __compactRuntime.CircuitContext<PS>,
          credential_0: LicenseCredential,
          issuerSignature_0: Schnorr_SchnorrSignature,
          claims_0: LicenseClaims,
          claimsOpening_0: Uint8Array,
          statusPath_0: { leaf: Uint8Array,
                          path: { sibling: { field: bigint }, goes_left: boolean
                                }[]
                        },
          holderSignature_0: Schnorr_SchnorrSignature,
          request_0: PresentationRequest): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly issuerPublicKey: __compactRuntime.JubjubPoint;
  readonly issuerDidContract: { bytes: Uint8Array };
  readonly issuerMethodId: Uint8Array;
  readonly registryId: Uint8Array;
  activeLicenses: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array>;
    findPathForLeaf(leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array> | undefined
  };
  readonly issuedCount: bigint;
  readonly revokedCount: bigint;
  verifications: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): VerificationRecord;
    [Symbol.iterator](): Iterator<[Uint8Array, VerificationRecord]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               issuerDid_0: { bytes: Uint8Array },
               methodId_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
