import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.16.0');

export var StatusType;
(function (StatusType) {
  StatusType[StatusType['none'] = 0] = 'none';
  StatusType[StatusType['revocationRegistry'] = 1] = 'revocationRegistry';
})(StatusType || (StatusType = {}));

const _descriptor_0 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

const _descriptor_1 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_2 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_3 = __compactRuntime.CompactTypeField;

class _MerkleTreeDigest_0 {
  alignment() {
    return _descriptor_3.alignment();
  }
  fromValue(value_0) {
    return {
      field: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.field);
  }
}

const _descriptor_4 = new _MerkleTreeDigest_0();

const _descriptor_5 = __compactRuntime.CompactTypeBoolean;

const _descriptor_6 = __compactRuntime.CompactTypeJubjubPoint;

class _ContractAddress_0 {
  alignment() {
    return _descriptor_1.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.bytes);
  }
}

const _descriptor_7 = new _ContractAddress_0();

const _descriptor_8 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

const _descriptor_9 = new __compactRuntime.CompactTypeUnsignedInteger(4294967295n, 4);

class _VerificationRecord_0 {
  alignment() {
    return _descriptor_8.alignment().concat(_descriptor_9.alignment());
  }
  fromValue(value_0) {
    return {
      category: _descriptor_8.fromValue(value_0),
      currentDay: _descriptor_9.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_8.toValue(value_0.category).concat(_descriptor_9.toValue(value_0.currentDay));
  }
}

const _descriptor_10 = new _VerificationRecord_0();

class _VerificationMethodRef_0 {
  alignment() {
    return _descriptor_7.alignment().concat(_descriptor_1.alignment());
  }
  fromValue(value_0) {
    return {
      didContractAddress: _descriptor_7.fromValue(value_0),
      methodId: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_7.toValue(value_0.didContractAddress).concat(_descriptor_1.toValue(value_0.methodId));
  }
}

const _descriptor_11 = new _VerificationMethodRef_0();

class _HolderKeyBinding_0 {
  alignment() {
    return _descriptor_6.alignment();
  }
  fromValue(value_0) {
    return {
      holderPublicKey: _descriptor_6.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_6.toValue(value_0.holderPublicKey);
  }
}

const _descriptor_12 = new _HolderKeyBinding_0();

const _descriptor_13 = new __compactRuntime.CompactTypeEnum(1, 1);

class _StatusRegistryRef_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_11.alignment());
  }
  fromValue(value_0) {
    return {
      registryId: _descriptor_1.fromValue(value_0),
      authorityVerificationMethodRef: _descriptor_11.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.registryId).concat(_descriptor_11.toValue(value_0.authorityVerificationMethodRef));
  }
}

const _descriptor_14 = new _StatusRegistryRef_0();

class _RegistryBoundStatusBinding_0 {
  alignment() {
    return _descriptor_13.alignment().concat(_descriptor_14.alignment().concat(_descriptor_1.alignment()));
  }
  fromValue(value_0) {
    return {
      statusType: _descriptor_13.fromValue(value_0),
      registryRef: _descriptor_14.fromValue(value_0),
      statusHandleCommitment: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_13.toValue(value_0.statusType).concat(_descriptor_14.toValue(value_0.registryRef).concat(_descriptor_1.toValue(value_0.statusHandleCommitment)));
  }
}

const _descriptor_15 = new _RegistryBoundStatusBinding_0();

class _LicenseCredential_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_11.alignment().concat(_descriptor_12.alignment().concat(_descriptor_15.alignment().concat(_descriptor_2.alignment().concat(_descriptor_1.alignment()))))));
  }
  fromValue(value_0) {
    return {
      version: _descriptor_0.fromValue(value_0),
      schemaId: _descriptor_1.fromValue(value_0),
      issuer: _descriptor_11.fromValue(value_0),
      holderBinding: _descriptor_12.fromValue(value_0),
      statusBinding: _descriptor_15.fromValue(value_0),
      issuedAt: _descriptor_2.fromValue(value_0),
      claimsCommitment: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.version).concat(_descriptor_1.toValue(value_0.schemaId).concat(_descriptor_11.toValue(value_0.issuer).concat(_descriptor_12.toValue(value_0.holderBinding).concat(_descriptor_15.toValue(value_0.statusBinding).concat(_descriptor_2.toValue(value_0.issuedAt).concat(_descriptor_1.toValue(value_0.claimsCommitment)))))));
  }
}

const _descriptor_16 = new _LicenseCredential_0();

class _SchnorrSignature_0 {
  alignment() {
    return _descriptor_6.alignment().concat(_descriptor_3.alignment());
  }
  fromValue(value_0) {
    return {
      announcement: _descriptor_6.fromValue(value_0),
      response: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_6.toValue(value_0.announcement).concat(_descriptor_3.toValue(value_0.response));
  }
}

const _descriptor_17 = new _SchnorrSignature_0();

const _descriptor_18 = new __compactRuntime.CompactTypeBytes(64);

class _LicenseClaims_0 {
  alignment() {
    return _descriptor_8.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_18.alignment().concat(_descriptor_9.alignment().concat(_descriptor_9.alignment())))));
  }
  fromValue(value_0) {
    return {
      category: _descriptor_8.fromValue(value_0),
      jurisdiction: _descriptor_1.fromValue(value_0),
      licenseNumber: _descriptor_1.fromValue(value_0),
      holderName: _descriptor_18.fromValue(value_0),
      issuedAtDay: _descriptor_9.fromValue(value_0),
      expiresAtDay: _descriptor_9.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_8.toValue(value_0.category).concat(_descriptor_1.toValue(value_0.jurisdiction).concat(_descriptor_1.toValue(value_0.licenseNumber).concat(_descriptor_18.toValue(value_0.holderName).concat(_descriptor_9.toValue(value_0.issuedAtDay).concat(_descriptor_9.toValue(value_0.expiresAtDay))))));
  }
}

const _descriptor_19 = new _LicenseClaims_0();

class _MerkleTreePathEntry_0 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_5.alignment());
  }
  fromValue(value_0) {
    return {
      sibling: _descriptor_4.fromValue(value_0),
      goes_left: _descriptor_5.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.sibling).concat(_descriptor_5.toValue(value_0.goes_left));
  }
}

const _descriptor_20 = new _MerkleTreePathEntry_0();

const _descriptor_21 = new __compactRuntime.CompactTypeVector(8, _descriptor_20);

class _MerkleTreePath_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_21.alignment());
  }
  fromValue(value_0) {
    return {
      leaf: _descriptor_1.fromValue(value_0),
      path: _descriptor_21.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.leaf).concat(_descriptor_21.toValue(value_0.path));
  }
}

const _descriptor_22 = new _MerkleTreePath_0();

class _PresentationRequest_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_8.alignment().concat(_descriptor_9.alignment()));
  }
  fromValue(value_0) {
    return {
      challenge: _descriptor_1.fromValue(value_0),
      requiredCategory: _descriptor_8.fromValue(value_0),
      currentDay: _descriptor_9.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.challenge).concat(_descriptor_8.toValue(value_0.requiredCategory).concat(_descriptor_9.toValue(value_0.currentDay)));
  }
}

const _descriptor_23 = new _PresentationRequest_0();

const _descriptor_24 = new __compactRuntime.CompactTypeVector(4, _descriptor_3);

const _descriptor_25 = new __compactRuntime.CompactTypeUnsignedInteger(127n, 1);

const _descriptor_26 = new __compactRuntime.CompactTypeUnsignedInteger(452312848583266388373324160190187140051835877600158453279131187530910662655n, 31);

class _tuple_0 {
  alignment() {
    return _descriptor_25.alignment().concat(_descriptor_26.alignment());
  }
  fromValue(value_0) {
    return [
      _descriptor_25.fromValue(value_0),
      _descriptor_26.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_25.toValue(value_0[0]).concat(_descriptor_26.toValue(value_0[1]));
  }
}

const _descriptor_27 = new _tuple_0();

const _descriptor_28 = new __compactRuntime.CompactTypeBytes(6);

class _LeafPreimage_0 {
  alignment() {
    return _descriptor_28.alignment().concat(_descriptor_1.alignment());
  }
  fromValue(value_0) {
    return {
      domain_sep: _descriptor_28.fromValue(value_0),
      data: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_28.toValue(value_0.domain_sep).concat(_descriptor_1.toValue(value_0.data));
  }
}

const _descriptor_29 = new _LeafPreimage_0();

const _descriptor_30 = new __compactRuntime.CompactTypeVector(2, _descriptor_1);

class _SchnorrHashInput_0 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_24.alignment()))));
  }
  fromValue(value_0) {
    return {
      ann_x: _descriptor_3.fromValue(value_0),
      ann_y: _descriptor_3.fromValue(value_0),
      pk_x: _descriptor_3.fromValue(value_0),
      pk_y: _descriptor_3.fromValue(value_0),
      msg: _descriptor_24.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.ann_x).concat(_descriptor_3.toValue(value_0.ann_y).concat(_descriptor_3.toValue(value_0.pk_x).concat(_descriptor_3.toValue(value_0.pk_y).concat(_descriptor_24.toValue(value_0.msg)))));
  }
}

const _descriptor_31 = new _SchnorrHashInput_0();

const _descriptor_32 = new __compactRuntime.CompactTypeVector(2, _descriptor_3);

class _DomainTag_0 {
  alignment() {
    return _descriptor_1.alignment();
  }
  fromValue(value_0) {
    return {
      domain: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.domain);
  }
}

const _descriptor_33 = new _DomainTag_0();

class _Either_0 {
  alignment() {
    return _descriptor_5.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_5.fromValue(value_0),
      left: _descriptor_1.fromValue(value_0),
      right: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_5.toValue(value_0.is_left).concat(_descriptor_1.toValue(value_0.left).concat(_descriptor_1.toValue(value_0.right)));
  }
}

const _descriptor_34 = new _Either_0();

const _descriptor_35 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.getSchnorrReduction) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named getSchnorrReduction');
    }
    if (typeof(witnesses_0.issuerSecretKey) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named issuerSecretKey');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      credentialDigest(context, ...args_1) {
        return { result: pureCircuits.credentialDigest(...args_1), context };
      },
      presentationDigest(context, ...args_1) {
        return { result: pureCircuits.presentationDigest(...args_1), context };
      },
      claimsCommitment(context, ...args_1) {
        return { result: pureCircuits.claimsCommitment(...args_1), context };
      },
      statusHandleCommitment(context, ...args_1) {
        return { result: pureCircuits.statusHandleCommitment(...args_1), context };
      },
      issue: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`issue: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const statusHandleCommitment_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('issue',
                                     'argument 1 (as invoked from Typescript)',
                                     'license-registry.compact line 141 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(statusHandleCommitment_0.buffer instanceof ArrayBuffer && statusHandleCommitment_0.BYTES_PER_ELEMENT === 1 && statusHandleCommitment_0.length === 32)) {
          __compactRuntime.typeError('issue',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'license-registry.compact line 141 char 1',
                                     'Bytes<32>',
                                     statusHandleCommitment_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(statusHandleCommitment_0),
            alignment: _descriptor_1.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._issue_0(context,
                                       partialProofData,
                                       statusHandleCommitment_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      revoke: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`revoke: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const index_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('revoke',
                                     'argument 1 (as invoked from Typescript)',
                                     'license-registry.compact line 148 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(index_0) === 'bigint' && index_0 >= 0n && index_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('revoke',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'license-registry.compact line 148 char 1',
                                     'Uint<0..18446744073709551616>',
                                     index_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_2.toValue(index_0),
            alignment: _descriptor_2.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._revoke_0(context, partialProofData, index_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      present: (...args_1) => {
        if (args_1.length !== 8) {
          throw new __compactRuntime.CompactError(`present: expected 8 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const credential_0 = args_1[1];
        const issuerSignature_0 = args_1[2];
        const claims_0 = args_1[3];
        const claimsOpening_0 = args_1[4];
        const statusPath_0 = args_1[5];
        const holderSignature_0 = args_1[6];
        const request_0 = args_1[7];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('present',
                                     'argument 1 (as invoked from Typescript)',
                                     'license-registry.compact line 154 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(credential_0) === 'object' && typeof(credential_0.version) === 'bigint' && credential_0.version >= 0n && credential_0.version <= 65535n && credential_0.schemaId.buffer instanceof ArrayBuffer && credential_0.schemaId.BYTES_PER_ELEMENT === 1 && credential_0.schemaId.length === 32 && typeof(credential_0.issuer) === 'object' && typeof(credential_0.issuer.didContractAddress) === 'object' && credential_0.issuer.didContractAddress.bytes.buffer instanceof ArrayBuffer && credential_0.issuer.didContractAddress.bytes.BYTES_PER_ELEMENT === 1 && credential_0.issuer.didContractAddress.bytes.length === 32 && credential_0.issuer.methodId.buffer instanceof ArrayBuffer && credential_0.issuer.methodId.BYTES_PER_ELEMENT === 1 && credential_0.issuer.methodId.length === 32 && typeof(credential_0.holderBinding) === 'object' && true && typeof(credential_0.statusBinding) === 'object' && typeof(credential_0.statusBinding.statusType) === 'number' && credential_0.statusBinding.statusType >= 0 && credential_0.statusBinding.statusType <= 1 && typeof(credential_0.statusBinding.registryRef) === 'object' && credential_0.statusBinding.registryRef.registryId.buffer instanceof ArrayBuffer && credential_0.statusBinding.registryRef.registryId.BYTES_PER_ELEMENT === 1 && credential_0.statusBinding.registryRef.registryId.length === 32 && typeof(credential_0.statusBinding.registryRef.authorityVerificationMethodRef) === 'object' && typeof(credential_0.statusBinding.registryRef.authorityVerificationMethodRef.didContractAddress) === 'object' && credential_0.statusBinding.registryRef.authorityVerificationMethodRef.didContractAddress.bytes.buffer instanceof ArrayBuffer && credential_0.statusBinding.registryRef.authorityVerificationMethodRef.didContractAddress.bytes.BYTES_PER_ELEMENT === 1 && credential_0.statusBinding.registryRef.authorityVerificationMethodRef.didContractAddress.bytes.length === 32 && credential_0.statusBinding.registryRef.authorityVerificationMethodRef.methodId.buffer instanceof ArrayBuffer && credential_0.statusBinding.registryRef.authorityVerificationMethodRef.methodId.BYTES_PER_ELEMENT === 1 && credential_0.statusBinding.registryRef.authorityVerificationMethodRef.methodId.length === 32 && credential_0.statusBinding.statusHandleCommitment.buffer instanceof ArrayBuffer && credential_0.statusBinding.statusHandleCommitment.BYTES_PER_ELEMENT === 1 && credential_0.statusBinding.statusHandleCommitment.length === 32 && typeof(credential_0.issuedAt) === 'bigint' && credential_0.issuedAt >= 0n && credential_0.issuedAt <= 18446744073709551615n && credential_0.claimsCommitment.buffer instanceof ArrayBuffer && credential_0.claimsCommitment.BYTES_PER_ELEMENT === 1 && credential_0.claimsCommitment.length === 32)) {
          __compactRuntime.typeError('present',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'license-registry.compact line 154 char 1',
                                     'struct LicenseCredential<version: Uint<0..65536>, schemaId: Bytes<32>, issuer: struct VerificationMethodRef<didContractAddress: struct ContractAddress<bytes: Bytes<32>>, methodId: Bytes<32>>, holderBinding: struct HolderKeyBinding<holderPublicKey: Opaque<"JubjubPoint">>, statusBinding: struct RegistryBoundStatusBinding<statusType: Enum<StatusType, none, revocationRegistry>, registryRef: struct StatusRegistryRef<registryId: Bytes<32>, authorityVerificationMethodRef: struct VerificationMethodRef<didContractAddress: struct ContractAddress<bytes: Bytes<32>>, methodId: Bytes<32>>>, statusHandleCommitment: Bytes<32>>, issuedAt: Uint<0..18446744073709551616>, claimsCommitment: Bytes<32>>',
                                     credential_0)
        }
        if (!(typeof(issuerSignature_0) === 'object' && true && typeof(issuerSignature_0.response) === 'bigint' && issuerSignature_0.response >= 0 && issuerSignature_0.response <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('present',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'license-registry.compact line 154 char 1',
                                     'struct SchnorrSignature<announcement: Opaque<"JubjubPoint">, response: Field>',
                                     issuerSignature_0)
        }
        if (!(typeof(claims_0) === 'object' && typeof(claims_0.category) === 'bigint' && claims_0.category >= 0n && claims_0.category <= 255n && claims_0.jurisdiction.buffer instanceof ArrayBuffer && claims_0.jurisdiction.BYTES_PER_ELEMENT === 1 && claims_0.jurisdiction.length === 32 && claims_0.licenseNumber.buffer instanceof ArrayBuffer && claims_0.licenseNumber.BYTES_PER_ELEMENT === 1 && claims_0.licenseNumber.length === 32 && claims_0.holderName.buffer instanceof ArrayBuffer && claims_0.holderName.BYTES_PER_ELEMENT === 1 && claims_0.holderName.length === 64 && typeof(claims_0.issuedAtDay) === 'bigint' && claims_0.issuedAtDay >= 0n && claims_0.issuedAtDay <= 4294967295n && typeof(claims_0.expiresAtDay) === 'bigint' && claims_0.expiresAtDay >= 0n && claims_0.expiresAtDay <= 4294967295n)) {
          __compactRuntime.typeError('present',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'license-registry.compact line 154 char 1',
                                     'struct LicenseClaims<category: Uint<0..256>, jurisdiction: Bytes<32>, licenseNumber: Bytes<32>, holderName: Bytes<64>, issuedAtDay: Uint<0..4294967296>, expiresAtDay: Uint<0..4294967296>>',
                                     claims_0)
        }
        if (!(claimsOpening_0.buffer instanceof ArrayBuffer && claimsOpening_0.BYTES_PER_ELEMENT === 1 && claimsOpening_0.length === 32)) {
          __compactRuntime.typeError('present',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'license-registry.compact line 154 char 1',
                                     'Bytes<32>',
                                     claimsOpening_0)
        }
        if (!(typeof(statusPath_0) === 'object' && statusPath_0.leaf.buffer instanceof ArrayBuffer && statusPath_0.leaf.BYTES_PER_ELEMENT === 1 && statusPath_0.leaf.length === 32 && Array.isArray(statusPath_0.path) && statusPath_0.path.length === 8 && statusPath_0.path.every((t) => typeof(t) === 'object' && typeof(t.sibling) === 'object' && typeof(t.sibling.field) === 'bigint' && t.sibling.field >= 0 && t.sibling.field <= __compactRuntime.MAX_FIELD && typeof(t.goes_left) === 'boolean'))) {
          __compactRuntime.typeError('present',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'license-registry.compact line 154 char 1',
                                     'struct MerkleTreePath<leaf: Bytes<32>, path: Vector<8, struct MerkleTreePathEntry<sibling: struct MerkleTreeDigest<field: Field>, goes_left: Boolean>>>',
                                     statusPath_0)
        }
        if (!(typeof(holderSignature_0) === 'object' && true && typeof(holderSignature_0.response) === 'bigint' && holderSignature_0.response >= 0 && holderSignature_0.response <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('present',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'license-registry.compact line 154 char 1',
                                     'struct SchnorrSignature<announcement: Opaque<"JubjubPoint">, response: Field>',
                                     holderSignature_0)
        }
        if (!(typeof(request_0) === 'object' && request_0.challenge.buffer instanceof ArrayBuffer && request_0.challenge.BYTES_PER_ELEMENT === 1 && request_0.challenge.length === 32 && typeof(request_0.requiredCategory) === 'bigint' && request_0.requiredCategory >= 0n && request_0.requiredCategory <= 255n && typeof(request_0.currentDay) === 'bigint' && request_0.currentDay >= 0n && request_0.currentDay <= 4294967295n)) {
          __compactRuntime.typeError('present',
                                     'argument 7 (argument 8 as invoked from Typescript)',
                                     'license-registry.compact line 154 char 1',
                                     'struct PresentationRequest<challenge: Bytes<32>, requiredCategory: Uint<0..256>, currentDay: Uint<0..4294967296>>',
                                     request_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_16.toValue(credential_0).concat(_descriptor_17.toValue(issuerSignature_0).concat(_descriptor_19.toValue(claims_0).concat(_descriptor_1.toValue(claimsOpening_0).concat(_descriptor_22.toValue(statusPath_0).concat(_descriptor_17.toValue(holderSignature_0).concat(_descriptor_23.toValue(request_0))))))),
            alignment: _descriptor_16.alignment().concat(_descriptor_17.alignment().concat(_descriptor_19.alignment().concat(_descriptor_1.alignment().concat(_descriptor_22.alignment().concat(_descriptor_17.alignment().concat(_descriptor_23.alignment()))))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._present_0(context,
                                         partialProofData,
                                         credential_0,
                                         issuerSignature_0,
                                         claims_0,
                                         claimsOpening_0,
                                         statusPath_0,
                                         holderSignature_0,
                                         request_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      }
    };
    this.impureCircuits = {
      issue: this.circuits.issue,
      revoke: this.circuits.revoke,
      present: this.circuits.present
    };
    this.provableCircuits = {
      issue: this.circuits.issue,
      revoke: this.circuits.revoke,
      present: this.circuits.present
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 3) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 3 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    const issuerDid_0 = args_0[1];
    const methodId_0 = args_0[2];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!(typeof(issuerDid_0) === 'object' && issuerDid_0.bytes.buffer instanceof ArrayBuffer && issuerDid_0.bytes.BYTES_PER_ELEMENT === 1 && issuerDid_0.bytes.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 1 (argument 2 as invoked from Typescript)',
                                 'license-registry.compact line 87 char 1',
                                 'struct ContractAddress<bytes: Bytes<32>>',
                                 issuerDid_0)
    }
    if (!(methodId_0.buffer instanceof ArrayBuffer && methodId_0.BYTES_PER_ELEMENT === 1 && methodId_0.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 2 (argument 3 as invoked from Typescript)',
                                 'license-registry.compact line 87 char 1',
                                 'Bytes<32>',
                                 methodId_0)
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('issue', new __compactRuntime.ContractOperation());
    state_0.setOperation('revoke', new __compactRuntime.ContractOperation());
    state_0.setOperation('present', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(0n),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(({x: 0n, y: 1n})),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(1n),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue({ bytes: new Uint8Array(32) }),
                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(2n),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new Uint8Array(32)),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(3n),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new Uint8Array(32)),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(4n),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newBoundedMerkleTree(
                                                                       new __compactRuntime.StateBoundedMerkleTree(8)
                                                                     )).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                        alignment: _descriptor_2.alignment() }))
                                                          .encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(5n),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(6n),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(7n),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_0 = this._ecMulGenerator_0(this._issuerSecretKey_0(context,
                                                                 partialProofData));
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(0n),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(tmp_0),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(1n),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(issuerDid_0),
                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(2n),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(methodId_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_1 = this._persistentHash_0(_descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                   partialProofData,
                                                                                                   [
                                                                                                    { dup: { n: 2 } },
                                                                                                    { idx: { cached: true,
                                                                                                             pushPath: false,
                                                                                                             path: [
                                                                                                                    { tag: 'value',
                                                                                                                      value: { value: _descriptor_8.toValue(0n),
                                                                                                                               alignment: _descriptor_8.alignment() } }] } },
                                                                                                    { popeq: { cached: true,
                                                                                                               result: undefined } }]).value));
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(3n),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_1),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _merkleTreePathRoot_0(path_0) {
    return { field:
               this._folder_0((...args_0) =>
                                this._merkleTreePathEntryRoot_0(...args_0),
                              this._degradeToTransient_0(this._persistentHash_2({ domain_sep:
                                                                                    new Uint8Array([109, 100, 110, 58, 108, 104]),
                                                                                  data:
                                                                                    path_0.leaf })),
                              path_0.path) };
  }
  _merkleTreePathEntryRoot_0(recursiveDigest_0, entry_0) {
    const left_0 = entry_0.goes_left ? recursiveDigest_0 : entry_0.sibling.field;
    const right_0 = entry_0.goes_left ?
                    entry_0.sibling.field :
                    recursiveDigest_0;
    return this._transientHash_5([left_0, right_0]);
  }
  _transientHash_0(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_16, value_0);
    return result_0;
  }
  _transientHash_1(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_23, value_0);
    return result_0;
  }
  _transientHash_2(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_33, value_0);
    return result_0;
  }
  _transientHash_3(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_1, value_0);
    return result_0;
  }
  _transientHash_4(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_31, value_0);
    return result_0;
  }
  _transientHash_5(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_32, value_0);
    return result_0;
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_7, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_30, value_0);
    return result_0;
  }
  _persistentHash_2(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_29, value_0);
    return result_0;
  }
  _persistentCommit_0(value_0, rand_0) {
    const result_0 = __compactRuntime.persistentCommit(_descriptor_19,
                                                       value_0,
                                                       rand_0);
    return result_0;
  }
  _degradeToTransient_0(x_0) {
    const result_0 = __compactRuntime.degradeToTransient(x_0);
    return result_0;
  }
  _jubjubPointX_0(np_0) {
    const result_0 = __compactRuntime.jubjubPointX(np_0);
    return result_0;
  }
  _jubjubPointY_0(np_0) {
    const result_0 = __compactRuntime.jubjubPointY(np_0);
    return result_0;
  }
  _ecAdd_0(a_0, b_0) {
    const result_0 = __compactRuntime.ecAdd(a_0, b_0);
    return result_0;
  }
  _ecMul_0(a_0, b_0) {
    const result_0 = __compactRuntime.ecMul(a_0, b_0);
    return result_0;
  }
  _ecMulGenerator_0(b_0) {
    const result_0 = __compactRuntime.ecMulGenerator(b_0);
    return result_0;
  }
  _getSchnorrReduction_0(context, partialProofData, challengeHash_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.getSchnorrReduction(witnessContext_0,
                                                                              challengeHash_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(Array.isArray(result_0) && result_0.length === 2  && typeof(result_0[0]) === 'bigint' && result_0[0] >= 0n && result_0[0] <= 127n && typeof(result_0[1]) === 'bigint' && result_0[1] >= 0n && result_0[1] <= 452312848583266388373324160190187140051835877600158453279131187530910662655n)) {
      __compactRuntime.typeError('getSchnorrReduction',
                                 'return value',
                                 'schnorr.compact line 32 char 3',
                                 '[Uint<0..128>, Uint<0..452312848583266388373324160190187140051835877600158453279131187530910662656>]',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_27.toValue(result_0),
      alignment: _descriptor_27.alignment()
    });
    return result_0;
  }
  _schnorrVerify_0(context, partialProofData, msg_0, signature_0, pk_0) {
    const __compact_pattern_tmp2_0 = signature_0;
    const announcement_0 = __compact_pattern_tmp2_0.announcement;
    const response_0 = __compact_pattern_tmp2_0.response;
    const cFull_0 = this._transientHash_4({ ann_x:
                                              this._jubjubPointX_0(announcement_0),
                                            ann_y:
                                              this._jubjubPointY_0(announcement_0),
                                            pk_x: this._jubjubPointX_0(pk_0),
                                            pk_y: this._jubjubPointY_0(pk_0),
                                            msg: msg_0 });
    const TWO_248_0 = 452312848583266388373324160190187140051835877600158453279131187530910662656n;
    const __compact_pattern_tmp1_0 = this._getSchnorrReduction_0(context,
                                                                 partialProofData,
                                                                 cFull_0);
    const q_0 = __compact_pattern_tmp1_0[0];
    const cTruncated_0 = __compact_pattern_tmp1_0[1];
    let t_0;
    __compactRuntime.assert((t_0 = q_0, t_0 < 116n),
                            'Schnorr quotient out of range');
    __compactRuntime.assert(__compactRuntime.addField(__compactRuntime.mulField(q_0,
                                                                                TWO_248_0),
                                                      cTruncated_0)
                            ===
                            cFull_0,
                            'Invalid challenge reduction');
    const c_0 = cTruncated_0;
    const lhs_0 = this._ecMulGenerator_0(response_0);
    const rhs_0 = this._ecAdd_0(announcement_0, this._ecMul_0(pk_0, c_0));
    __compactRuntime.assert(this._jubjubPointX_0(lhs_0)
                            ===
                            this._jubjubPointX_0(rhs_0)
                            &&
                            this._jubjubPointY_0(lhs_0)
                            ===
                            this._jubjubPointY_0(rhs_0),
                            'Invalid Jubjub Schnorr signature');
    return [];
  }
  _schnorrVerifyDigest_0(context, partialProofData, digest_0, signature_0, pk_0)
  {
    this._schnorrVerify_0(context, partialProofData, digest_0, signature_0, pk_0);
    return [];
  }
  _issuerSecretKey_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.issuerSecretKey(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0 && result_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('issuerSecretKey',
                                 'return value',
                                 'license-registry.compact line 85 char 1',
                                 'Field',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_3.toValue(result_0),
      alignment: _descriptor_3.alignment()
    });
    return result_0;
  }
  _credentialDigest_0(credential_0) {
    return [this._transientHash_2({ domain:
                                      new Uint8Array([101, 100, 100, 97, 58, 118, 99, 58, 108, 105, 99, 101, 110, 115, 101, 58, 105, 115, 115, 117, 101, 58, 118, 49, 0, 0, 0, 0, 0, 0, 0, 0]) }),
            this._transientHash_3(credential_0.statusBinding.registryRef.registryId),
            this._transientHash_0(credential_0),
            0n];
  }
  _presentationDigest_0(request_0, registry_0) {
    return [this._transientHash_2({ domain:
                                      new Uint8Array([101, 100, 100, 97, 58, 118, 99, 58, 108, 105, 99, 101, 110, 115, 101, 58, 112, 114, 101, 115, 101, 110, 116, 58, 118, 49, 0, 0, 0, 0, 0, 0]) }),
            this._transientHash_3(registry_0),
            this._transientHash_1(request_0),
            0n];
  }
  _claimsCommitment_0(claims_0, opening_0) {
    return this._persistentCommit_0(claims_0, opening_0);
  }
  _statusHandleCommitment_0(random_0) {
    return this._persistentHash_1([new Uint8Array([101, 100, 100, 97, 58, 118, 99, 58, 108, 105, 99, 101, 110, 115, 101, 58, 115, 116, 97, 116, 117, 115, 58, 118, 49, 0, 0, 0, 0, 0, 0, 0]),
                                   random_0]);
  }
  _assertIssuer_0(context, partialProofData) {
    const pk_0 = this._ecMulGenerator_0(this._issuerSecretKey_0(context,
                                                                partialProofData));
    __compactRuntime.assert(this._jubjubPointX_0(pk_0)
                            ===
                            this._jubjubPointX_0(_descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                           partialProofData,
                                                                                                           [
                                                                                                            { dup: { n: 0 } },
                                                                                                            { idx: { cached: false,
                                                                                                                     pushPath: false,
                                                                                                                     path: [
                                                                                                                            { tag: 'value',
                                                                                                                              value: { value: _descriptor_8.toValue(0n),
                                                                                                                                       alignment: _descriptor_8.alignment() } }] } },
                                                                                                            { popeq: { cached: false,
                                                                                                                       result: undefined } }]).value)),
                            'Not the registry issuer');
    __compactRuntime.assert(this._jubjubPointY_0(pk_0)
                            ===
                            this._jubjubPointY_0(_descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                           partialProofData,
                                                                                                           [
                                                                                                            { dup: { n: 0 } },
                                                                                                            { idx: { cached: false,
                                                                                                                     pushPath: false,
                                                                                                                     path: [
                                                                                                                            { tag: 'value',
                                                                                                                              value: { value: _descriptor_8.toValue(0n),
                                                                                                                                       alignment: _descriptor_8.alignment() } }] } },
                                                                                                            { popeq: { cached: false,
                                                                                                                       result: undefined } }]).value)),
                            'Not the registry issuer');
    return [];
  }
  _issue_0(context, partialProofData, statusHandleCommitment_0) {
    this._assertIssuer_0(context, partialProofData);
    __compactRuntime.assert(!_descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_8.toValue(4n),
                                                                                                                   alignment: _descriptor_8.alignment() } }] } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_8.toValue(1n),
                                                                                                                   alignment: _descriptor_8.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(256n),
                                                                                                                                               alignment: _descriptor_2.alignment() }).encode() } },
                                                                                        'lt',
                                                                                        'neg',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'Registry is full');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_8.toValue(4n),
                                                                  alignment: _descriptor_8.alignment() } }] } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_8.toValue(0n),
                                                                  alignment: _descriptor_8.alignment() } }] } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_8.toValue(1n),
                                                                  alignment: _descriptor_8.alignment() } }] } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell(__compactRuntime.leafHash(
                                                                                              { value: _descriptor_1.toValue(statusHandleCommitment_0),
                                                                                                alignment: _descriptor_1.alignment() }
                                                                                            )).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_8.toValue(1n),
                                                                  alignment: _descriptor_8.alignment() } }] } },
                                       { addi: { immediate: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    const tmp_0 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_8.toValue(5n),
                                                                  alignment: _descriptor_8.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(tmp_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _revoke_0(context, partialProofData, index_0) {
    this._assertIssuer_0(context, partialProofData);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_8.toValue(4n),
                                                                  alignment: _descriptor_8.alignment() } }] } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_8.toValue(0n),
                                                                  alignment: _descriptor_8.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(index_0),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell(__compactRuntime.leafHash(
                                                                                              { value: _descriptor_1.toValue(new Uint8Array(32)),
                                                                                                alignment: _descriptor_1.alignment() }
                                                                                            )).encode() } },
                                       { ins: { cached: false, n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_8.toValue(1n),
                                                                  alignment: _descriptor_8.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(index_0),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { addi: { immediate: 1 } },
                                       { dup: { n: 1 } },
                                       { dup: { n: 1 } },
                                       'lt',
                                       { branch: { skip: 2 } },
                                       'pop',
                                       { jmp: { skip: 2 } },
                                       { swap: { n: 0 } },
                                       'pop',
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_0 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_8.toValue(6n),
                                                                  alignment: _descriptor_8.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_0.toValue(tmp_0),
                                                                alignment: _descriptor_0.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _present_0(context,
             partialProofData,
             credential_0,
             issuerSignature_0,
             claims_0,
             claimsOpening_0,
             statusPath_0,
             holderSignature_0,
             request_0)
  {
    __compactRuntime.assert(this._equal_0(credential_0.version, 1n),
                            'Unsupported credential version');
    __compactRuntime.assert(this._equal_1(credential_0.schemaId,
                                          new Uint8Array([101, 100, 100, 97, 58, 118, 99, 58, 112, 114, 111, 102, 101, 115, 115, 105, 111, 110, 97, 108, 45, 108, 105, 99, 101, 110, 115, 101, 58, 118, 49, 0])),
                            'Unknown credential schema');
    __compactRuntime.assert(this._equal_2(credential_0.issuer.didContractAddress.bytes,
                                          _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 0 } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_8.toValue(1n),
                                                                                                                                alignment: _descriptor_8.alignment() } }] } },
                                                                                                     { popeq: { cached: false,
                                                                                                                result: undefined } }]).value).bytes),
                            'Issuer DID mismatch');
    __compactRuntime.assert(this._equal_3(credential_0.issuer.methodId,
                                          _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 0 } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_8.toValue(2n),
                                                                                                                                alignment: _descriptor_8.alignment() } }] } },
                                                                                                     { popeq: { cached: false,
                                                                                                                result: undefined } }]).value)),
                            'Issuer method mismatch');
    __compactRuntime.assert(credential_0.statusBinding.statusType === 1,
                            'Unsupported status type');
    __compactRuntime.assert(this._equal_4(credential_0.statusBinding.registryRef.registryId,
                                          _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 0 } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_8.toValue(3n),
                                                                                                                                alignment: _descriptor_8.alignment() } }] } },
                                                                                                     { popeq: { cached: false,
                                                                                                                result: undefined } }]).value)),
                            'Registry mismatch');
    this._schnorrVerifyDigest_0(context,
                                partialProofData,
                                this._credentialDigest_0(credential_0),
                                issuerSignature_0,
                                _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                          partialProofData,
                                                                                          [
                                                                                           { dup: { n: 0 } },
                                                                                           { idx: { cached: false,
                                                                                                    pushPath: false,
                                                                                                    path: [
                                                                                                           { tag: 'value',
                                                                                                             value: { value: _descriptor_8.toValue(0n),
                                                                                                                      alignment: _descriptor_8.alignment() } }] } },
                                                                                           { popeq: { cached: false,
                                                                                                      result: undefined } }]).value));
    __compactRuntime.assert(this._equal_5(this._claimsCommitment_0(claims_0,
                                                                   claimsOpening_0),
                                          credential_0.claimsCommitment),
                            'Claims do not open the credential commitment');
    __compactRuntime.assert(this._equal_6(claims_0.category,
                                          request_0.requiredCategory),
                            'License category does not satisfy request');
    let t_0;
    __compactRuntime.assert((t_0 = claims_0.expiresAtDay,
                             t_0 > request_0.currentDay),
                            'License expired');
    __compactRuntime.assert(this._equal_7(statusPath_0.leaf,
                                          credential_0.statusBinding.statusHandleCommitment),
                            'Status path is for another credential');
    let tmp_0;
    __compactRuntime.assert((tmp_0 = this._merkleTreePathRoot_0(statusPath_0),
                             _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_8.toValue(4n),
                                                                                                                   alignment: _descriptor_8.alignment() } }] } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_8.toValue(0n),
                                                                                                                   alignment: _descriptor_8.alignment() } }] } },
                                                                                        'root',
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(tmp_0),
                                                                                                                                               alignment: _descriptor_4.alignment() }).encode() } },
                                                                                        'eq',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value)),
                            'License is revoked or unknown');
    this._schnorrVerifyDigest_0(context,
                                partialProofData,
                                this._presentationDigest_0(request_0,
                                                           _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                                     partialProofData,
                                                                                                                     [
                                                                                                                      { dup: { n: 0 } },
                                                                                                                      { idx: { cached: false,
                                                                                                                               pushPath: false,
                                                                                                                               path: [
                                                                                                                                      { tag: 'value',
                                                                                                                                        value: { value: _descriptor_8.toValue(3n),
                                                                                                                                                 alignment: _descriptor_8.alignment() } }] } },
                                                                                                                      { popeq: { cached: false,
                                                                                                                                 result: undefined } }]).value)),
                                holderSignature_0,
                                credential_0.holderBinding.holderPublicKey);
    const challenge_0 = request_0.challenge;
    __compactRuntime.assert(!_descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_8.toValue(7n),
                                                                                                                   alignment: _descriptor_8.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(challenge_0),
                                                                                                                                               alignment: _descriptor_1.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'Challenge already answered');
    const tmp_1 = { category: request_0.requiredCategory,
                    currentDay: request_0.currentDay };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_8.toValue(7n),
                                                                  alignment: _descriptor_8.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(challenge_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(tmp_1),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _folder_0(f, x, a0) {
    for (let i = 0; i < 8; i++) { x = f(x, a0[i]); }
    return x;
  }
  _equal_0(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_1(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_2(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_3(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_4(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_5(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_6(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_7(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    get issuerPublicKey() {
      return _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_8.toValue(0n),
                                                                                                   alignment: _descriptor_8.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get issuerDidContract() {
      return _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_8.toValue(1n),
                                                                                                   alignment: _descriptor_8.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get issuerMethodId() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_8.toValue(2n),
                                                                                                   alignment: _descriptor_8.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get registryId() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_8.toValue(3n),
                                                                                                   alignment: _descriptor_8.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    activeLicenses: {
      isFull(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isFull: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_8.toValue(4n),
                                                                                                     alignment: _descriptor_8.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_8.toValue(1n),
                                                                                                     alignment: _descriptor_8.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(256n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'lt',
                                                                          'neg',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      checkRoot(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`checkRoot: expected 1 argument, received ${args_0.length}`);
        }
        const rt_0 = args_0[0];
        if (!(typeof(rt_0) === 'object' && typeof(rt_0.field) === 'bigint' && rt_0.field >= 0 && rt_0.field <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('checkRoot',
                                     'argument 1',
                                     'license-registry.compact line 80 char 1',
                                     'struct MerkleTreeDigest<field: Field>',
                                     rt_0)
        }
        return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_8.toValue(4n),
                                                                                                     alignment: _descriptor_8.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_8.toValue(0n),
                                                                                                     alignment: _descriptor_8.alignment() } }] } },
                                                                          'root',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(rt_0),
                                                                                                                                 alignment: _descriptor_4.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      root(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`root: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[4];
        return ((result) => result             ? __compactRuntime.CompactTypeMerkleTreeDigest.fromValue(result)             : undefined)(self_0.asArray()[0].asBoundedMerkleTree().rehash().root()?.value);
      },
      firstFree(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`first_free: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[4];
        return __compactRuntime.CompactTypeField.fromValue(self_0.asArray()[1].asCell().value);
      },
      pathForLeaf(...args_0) {
        if (args_0.length !== 2) {
          throw new __compactRuntime.CompactError(`path_for_leaf: expected 2 arguments, received ${args_0.length}`);
        }
        const index_0 = args_0[0];
        const leaf_0 = args_0[1];
        if (!(typeof(index_0) === 'bigint' && index_0 >= 0 && index_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('path_for_leaf',
                                     'argument 1',
                                     'license-registry.compact line 80 char 1',
                                     'Field',
                                     index_0)
        }
        if (!(leaf_0.buffer instanceof ArrayBuffer && leaf_0.BYTES_PER_ELEMENT === 1 && leaf_0.length === 32)) {
          __compactRuntime.typeError('path_for_leaf',
                                     'argument 2',
                                     'license-registry.compact line 80 char 1',
                                     'Bytes<32>',
                                     leaf_0)
        }
        const self_0 = state.asArray()[4];
        return ((result) => result             ? new __compactRuntime.CompactTypeMerkleTreePath(8, _descriptor_1).fromValue(result)             : undefined)(  self_0.asArray()[0].asBoundedMerkleTree().rehash().pathForLeaf(    index_0,    {      value: _descriptor_1.toValue(leaf_0),      alignment: _descriptor_1.alignment()    }  )?.value);
      },
      findPathForLeaf(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`find_path_for_leaf: expected 1 argument, received ${args_0.length}`);
        }
        const leaf_0 = args_0[0];
        if (!(leaf_0.buffer instanceof ArrayBuffer && leaf_0.BYTES_PER_ELEMENT === 1 && leaf_0.length === 32)) {
          __compactRuntime.typeError('find_path_for_leaf',
                                     'argument 1',
                                     'license-registry.compact line 80 char 1',
                                     'Bytes<32>',
                                     leaf_0)
        }
        const self_0 = state.asArray()[4];
        return ((result) => result             ? new __compactRuntime.CompactTypeMerkleTreePath(8, _descriptor_1).fromValue(result)             : undefined)(  self_0.asArray()[0].asBoundedMerkleTree().rehash().findPathForLeaf(    {      value: _descriptor_1.toValue(leaf_0),      alignment: _descriptor_1.alignment()    }  )?.value);
      }
    },
    get issuedCount() {
      return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_8.toValue(5n),
                                                                                                   alignment: _descriptor_8.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get revokedCount() {
      return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_8.toValue(6n),
                                                                                                   alignment: _descriptor_8.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    verifications: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_8.toValue(7n),
                                                                                                     alignment: _descriptor_8.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_8.toValue(7n),
                                                                                                     alignment: _descriptor_8.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'license-registry.compact line 83 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_8.toValue(7n),
                                                                                                     alignment: _descriptor_8.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(key_0),
                                                                                                                                 alignment: _descriptor_1.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'license-registry.compact line 83 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_8.toValue(7n),
                                                                                                      alignment: _descriptor_8.alignment() } }] } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_1.toValue(key_0),
                                                                                                      alignment: _descriptor_1.alignment() } }] } },
                                                                           { popeq: { cached: false,
                                                                                      result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[7];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_1.fromValue(key.value),      _descriptor_10.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  getSchnorrReduction: (...args) => undefined,
  issuerSecretKey: (...args) => undefined
});
export const pureCircuits = {
  credentialDigest: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`credentialDigest: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const credential_0 = args_0[0];
    if (!(typeof(credential_0) === 'object' && typeof(credential_0.version) === 'bigint' && credential_0.version >= 0n && credential_0.version <= 65535n && credential_0.schemaId.buffer instanceof ArrayBuffer && credential_0.schemaId.BYTES_PER_ELEMENT === 1 && credential_0.schemaId.length === 32 && typeof(credential_0.issuer) === 'object' && typeof(credential_0.issuer.didContractAddress) === 'object' && credential_0.issuer.didContractAddress.bytes.buffer instanceof ArrayBuffer && credential_0.issuer.didContractAddress.bytes.BYTES_PER_ELEMENT === 1 && credential_0.issuer.didContractAddress.bytes.length === 32 && credential_0.issuer.methodId.buffer instanceof ArrayBuffer && credential_0.issuer.methodId.BYTES_PER_ELEMENT === 1 && credential_0.issuer.methodId.length === 32 && typeof(credential_0.holderBinding) === 'object' && true && typeof(credential_0.statusBinding) === 'object' && typeof(credential_0.statusBinding.statusType) === 'number' && credential_0.statusBinding.statusType >= 0 && credential_0.statusBinding.statusType <= 1 && typeof(credential_0.statusBinding.registryRef) === 'object' && credential_0.statusBinding.registryRef.registryId.buffer instanceof ArrayBuffer && credential_0.statusBinding.registryRef.registryId.BYTES_PER_ELEMENT === 1 && credential_0.statusBinding.registryRef.registryId.length === 32 && typeof(credential_0.statusBinding.registryRef.authorityVerificationMethodRef) === 'object' && typeof(credential_0.statusBinding.registryRef.authorityVerificationMethodRef.didContractAddress) === 'object' && credential_0.statusBinding.registryRef.authorityVerificationMethodRef.didContractAddress.bytes.buffer instanceof ArrayBuffer && credential_0.statusBinding.registryRef.authorityVerificationMethodRef.didContractAddress.bytes.BYTES_PER_ELEMENT === 1 && credential_0.statusBinding.registryRef.authorityVerificationMethodRef.didContractAddress.bytes.length === 32 && credential_0.statusBinding.registryRef.authorityVerificationMethodRef.methodId.buffer instanceof ArrayBuffer && credential_0.statusBinding.registryRef.authorityVerificationMethodRef.methodId.BYTES_PER_ELEMENT === 1 && credential_0.statusBinding.registryRef.authorityVerificationMethodRef.methodId.length === 32 && credential_0.statusBinding.statusHandleCommitment.buffer instanceof ArrayBuffer && credential_0.statusBinding.statusHandleCommitment.BYTES_PER_ELEMENT === 1 && credential_0.statusBinding.statusHandleCommitment.length === 32 && typeof(credential_0.issuedAt) === 'bigint' && credential_0.issuedAt >= 0n && credential_0.issuedAt <= 18446744073709551615n && credential_0.claimsCommitment.buffer instanceof ArrayBuffer && credential_0.claimsCommitment.BYTES_PER_ELEMENT === 1 && credential_0.claimsCommitment.length === 32)) {
      __compactRuntime.typeError('credentialDigest',
                                 'argument 1',
                                 'license-registry.compact line 97 char 1',
                                 'struct LicenseCredential<version: Uint<0..65536>, schemaId: Bytes<32>, issuer: struct VerificationMethodRef<didContractAddress: struct ContractAddress<bytes: Bytes<32>>, methodId: Bytes<32>>, holderBinding: struct HolderKeyBinding<holderPublicKey: Opaque<"JubjubPoint">>, statusBinding: struct RegistryBoundStatusBinding<statusType: Enum<StatusType, none, revocationRegistry>, registryRef: struct StatusRegistryRef<registryId: Bytes<32>, authorityVerificationMethodRef: struct VerificationMethodRef<didContractAddress: struct ContractAddress<bytes: Bytes<32>>, methodId: Bytes<32>>>, statusHandleCommitment: Bytes<32>>, issuedAt: Uint<0..18446744073709551616>, claimsCommitment: Bytes<32>>',
                                 credential_0)
    }
    return _dummyContract._credentialDigest_0(credential_0);
  },
  presentationDigest: (...args_0) => {
    if (args_0.length !== 2) {
      throw new __compactRuntime.CompactError(`presentationDigest: expected 2 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const request_0 = args_0[0];
    const registry_0 = args_0[1];
    if (!(typeof(request_0) === 'object' && request_0.challenge.buffer instanceof ArrayBuffer && request_0.challenge.BYTES_PER_ELEMENT === 1 && request_0.challenge.length === 32 && typeof(request_0.requiredCategory) === 'bigint' && request_0.requiredCategory >= 0n && request_0.requiredCategory <= 255n && typeof(request_0.currentDay) === 'bigint' && request_0.currentDay >= 0n && request_0.currentDay <= 4294967295n)) {
      __compactRuntime.typeError('presentationDigest',
                                 'argument 1',
                                 'license-registry.compact line 106 char 1',
                                 'struct PresentationRequest<challenge: Bytes<32>, requiredCategory: Uint<0..256>, currentDay: Uint<0..4294967296>>',
                                 request_0)
    }
    if (!(registry_0.buffer instanceof ArrayBuffer && registry_0.BYTES_PER_ELEMENT === 1 && registry_0.length === 32)) {
      __compactRuntime.typeError('presentationDigest',
                                 'argument 2',
                                 'license-registry.compact line 106 char 1',
                                 'Bytes<32>',
                                 registry_0)
    }
    return _dummyContract._presentationDigest_0(request_0, registry_0);
  },
  claimsCommitment: (...args_0) => {
    if (args_0.length !== 2) {
      throw new __compactRuntime.CompactError(`claimsCommitment: expected 2 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const claims_0 = args_0[0];
    const opening_0 = args_0[1];
    if (!(typeof(claims_0) === 'object' && typeof(claims_0.category) === 'bigint' && claims_0.category >= 0n && claims_0.category <= 255n && claims_0.jurisdiction.buffer instanceof ArrayBuffer && claims_0.jurisdiction.BYTES_PER_ELEMENT === 1 && claims_0.jurisdiction.length === 32 && claims_0.licenseNumber.buffer instanceof ArrayBuffer && claims_0.licenseNumber.BYTES_PER_ELEMENT === 1 && claims_0.licenseNumber.length === 32 && claims_0.holderName.buffer instanceof ArrayBuffer && claims_0.holderName.BYTES_PER_ELEMENT === 1 && claims_0.holderName.length === 64 && typeof(claims_0.issuedAtDay) === 'bigint' && claims_0.issuedAtDay >= 0n && claims_0.issuedAtDay <= 4294967295n && typeof(claims_0.expiresAtDay) === 'bigint' && claims_0.expiresAtDay >= 0n && claims_0.expiresAtDay <= 4294967295n)) {
      __compactRuntime.typeError('claimsCommitment',
                                 'argument 1',
                                 'license-registry.compact line 121 char 1',
                                 'struct LicenseClaims<category: Uint<0..256>, jurisdiction: Bytes<32>, licenseNumber: Bytes<32>, holderName: Bytes<64>, issuedAtDay: Uint<0..4294967296>, expiresAtDay: Uint<0..4294967296>>',
                                 claims_0)
    }
    if (!(opening_0.buffer instanceof ArrayBuffer && opening_0.BYTES_PER_ELEMENT === 1 && opening_0.length === 32)) {
      __compactRuntime.typeError('claimsCommitment',
                                 'argument 2',
                                 'license-registry.compact line 121 char 1',
                                 'Bytes<32>',
                                 opening_0)
    }
    return _dummyContract._claimsCommitment_0(claims_0, opening_0);
  },
  statusHandleCommitment: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`statusHandleCommitment: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const random_0 = args_0[0];
    if (!(random_0.buffer instanceof ArrayBuffer && random_0.BYTES_PER_ELEMENT === 1 && random_0.length === 32)) {
      __compactRuntime.typeError('statusHandleCommitment',
                                 'argument 1',
                                 'license-registry.compact line 125 char 1',
                                 'Bytes<32>',
                                 random_0)
    }
    return _dummyContract._statusHandleCommitment_0(random_0);
  }
};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
