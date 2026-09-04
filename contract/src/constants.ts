// Constants shared between the Compact source and TypeScript. Keep in sync with license-registry.compact.

/** Value of `pad(32, "edda:vc:professional-license:v1")` — the credential schema id. */
export const SCHEMA_ID_TEXT = "edda:vc:professional-license:v1";
/** Method id the issuer DID publishes its Jubjub signing key under. */
export const ISSUER_METHOD_ID_TEXT = "#key-assert";
/** Credential envelope version accepted by `present`. */
export const CREDENTIAL_VERSION = 1n;
/** Depth of the active-licence Merkle tree (`MerkleTree<8, Bytes<32>>`). */
export const TREE_DEPTH = 8;

export const LICENSE_CATEGORIES: Record<number, string> = {
  1: "Electrician",
  2: "Plumber",
  3: "Gas fitter",
  4: "Electrical inspector",
};

/** `pad(32, text)`: UTF-8 bytes, zero-padded on the right to 32 bytes. */
export const pad32 = (text: string): Uint8Array => padBytes(text, 32);

export const padBytes = (text: string, length: number): Uint8Array => {
  const encoded = new TextEncoder().encode(text);
  if (encoded.length > length) {
    throw new Error(`"${text}" does not fit in ${length} bytes`);
  }
  const out = new Uint8Array(length);
  out.set(encoded);
  return out;
};

/** Inverse of `padBytes` for display: strips trailing zero bytes and decodes UTF-8. */
export const unpadBytes = (bytes: Uint8Array): string => {
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) end--;
  return new TextDecoder().decode(bytes.subarray(0, end));
};

export const SCHEMA_ID = pad32(SCHEMA_ID_TEXT);
export const ISSUER_METHOD_ID = pad32(ISSUER_METHOD_ID_TEXT);
