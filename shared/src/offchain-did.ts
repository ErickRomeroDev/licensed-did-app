// Practitioner identity as an offchain long-form did:midnight (method spec §2.1), derived from a Jubjub key.
// Uses the reference implementation's encoder/resolver; the JWK coordinate encoding follows
// midnight-did/packages/did/src/ledger-to-domain.ts (32-byte little-endian, base64url).
import type { JubjubPoint } from "@midnight-ntwrk/compact-runtime";
import { resolveLongFormOffchainMidnightDID } from "@midnight-ntwrk/midnight-did";
import {
  createLongFormOffchainMidnightDIDString,
  CurveType,
  decodeBase64UrlBytes32,
  encodeBase64Url,
  KeyType,
  type OffchainMidnightDIDState,
  type PublicKeyJwk,
} from "@midnight-ntwrk/midnight-did-domain";

export const HOLDER_KEY_ID = "#key-1";

export const bigintTo32Le = (value: bigint): Uint8Array => {
  if (value < 0n || value >= 1n << 256n) throw new Error("Jubjub coordinate does not fit in 32 bytes");
  const out = new Uint8Array(32);
  let v = value;
  for (let i = 0; i < 32; i++) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
};

export const bytes32LeToBigint = (bytes: Uint8Array): bigint => {
  if (bytes.length !== 32) throw new Error("expected 32 bytes");
  let v = 0n;
  for (let i = 31; i >= 0; i--) v = (v << 8n) | BigInt(bytes[i]!);
  return v;
};

export const jubjubPointToJwk = (point: JubjubPoint): PublicKeyJwk => ({
  kty: KeyType.EC,
  crv: CurveType.Jubjub,
  x: encodeBase64Url(bigintTo32Le(point.x)),
  y: encodeBase64Url(bigintTo32Le(point.y)),
});

export const jwkToJubjubPoint = (jwk: PublicKeyJwk): JubjubPoint => {
  if (jwk.kty !== KeyType.EC || jwk.crv !== CurveType.Jubjub || typeof jwk.y !== "string") {
    throw new Error("Verification method is not a Jubjub key");
  }
  return {
    x: bytes32LeToBigint(decodeBase64UrlBytes32(jwk.x, "x")),
    y: bytes32LeToBigint(decodeBase64UrlBytes32(jwk.y, "y")),
  };
};

export const holderStateFromKey = (publicKey: JubjubPoint): OffchainMidnightDIDState => ({
  version: 1,
  alsoKnownAs: [],
  verificationMethod: [
    {
      id: HOLDER_KEY_ID,
      publicKeyJwk: jubjubPointToJwk(publicKey),
      relationships: {
        authentication: true,
        assertionMethod: true,
        keyAgreement: false,
        capabilityInvocation: false,
        capabilityDelegation: false,
      },
    },
  ],
  service: [],
});

/** `did:midnight:offchain:<blake2s-hash>:<base64url-state>` for a Jubjub public key. */
export const holderDidFromKey = (publicKey: JubjubPoint): string =>
  createLongFormOffchainMidnightDIDString(holderStateFromKey(publicKey));

/** Resolve a practitioner DID (no network) and return its Jubjub key and DID document. */
export const resolveHolderDid = (did: string) => {
  const resolved = resolveLongFormOffchainMidnightDID(did.trim());
  const method = resolved.state.verificationMethod.find((m) => m.id === HOLDER_KEY_ID) ?? resolved.state.verificationMethod[0];
  if (!method) throw new Error("Practitioner DID has no verification method");
  if (!method.relationships.assertionMethod) throw new Error("Practitioner key is not an assertionMethod");
  return { publicKey: jwkToJubjubPoint(method.publicKeyJwk), didDocument: resolved.didDocument, did: resolved.did };
};

export const holderKeyFromDid = (did: string): JubjubPoint => resolveHolderDid(did).publicKey;
