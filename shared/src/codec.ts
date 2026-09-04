// JSON codec that round-trips `bigint` and `Uint8Array`, used for IndexedDB records, board export files,
// and the copy/paste strings exchanged between the three roles.

const BIGINT_TAG = "$bigint:";
const BYTES_TAG = "$bytes:";

export const toBase64Url = (bytes: Uint8Array): string => {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const fromBase64Url = (text: string): Uint8Array => {
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (text.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

export const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

export const fromHex = (hex: string): Uint8Array => {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0 || /[^0-9a-fA-F]/.test(clean)) throw new Error("Invalid hex string");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
};

const replacer = (_key: string, value: unknown): unknown => {
  if (typeof value === "bigint") return `${BIGINT_TAG}${value.toString()}`;
  if (value instanceof Uint8Array) return `${BYTES_TAG}${toBase64Url(value)}`;
  return value;
};

const reviver = (_key: string, value: unknown): unknown => {
  if (typeof value === "string") {
    if (value.startsWith(BIGINT_TAG)) return BigInt(value.slice(BIGINT_TAG.length));
    if (value.startsWith(BYTES_TAG)) return fromBase64Url(value.slice(BYTES_TAG.length));
  }
  return value;
};

export const encodeJson = (value: unknown, pretty = false): string =>
  JSON.stringify(value, replacer, pretty ? 2 : undefined);

export const decodeJson = <T>(text: string): T => JSON.parse(text, reviver) as T;

/** Compact transport string for copy/paste and QR: base64url of the JSON. */
export const encodeWire = (value: unknown): string => toBase64Url(new TextEncoder().encode(encodeJson(value)));

export const decodeWire = <T>(text: string): T => {
  const trimmed = text.trim();
  // Accept raw JSON too, for people pasting from the export dialog.
  if (trimmed.startsWith("{")) return decodeJson<T>(trimmed);
  return decodeJson<T>(new TextDecoder().decode(fromBase64Url(trimmed)));
};

export const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);
