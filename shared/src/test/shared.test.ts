import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, expect, it } from "vitest";
import {
  buildCredential,
  claimsFromInput,
  commitClaims,
  decodeJson,
  decodeWire,
  encodeJson,
  encodeWire,
  fromHex,
  holderDidFromKey,
  holderKeyFromDid,
  isoDateToDays,
  daysToIsoDate,
  newStatusHandle,
  publicKeyOf,
  randomBytes,
  randomScalar,
  resolveHolderDid,
  signCredential,
  signPresentation,
  toHex,
  verifyCredential,
  type BoardState,
} from "../index.js";
import { presentationDigest } from "../credential.js";
import { verifyJubjubDigest } from "@midnight-ntwrk/midnight-did-jubjub-schnorr";

setNetworkId("undeployed");

describe("codec", () => {
  it("round-trips bigint and Uint8Array through JSON and wire strings", () => {
    const board: BoardState = {
      version: 1,
      network: "undeployed",
      boardName: "Board",
      didContractAddress: toHex(randomBytes(32)),
      didControllerSecret: randomBytes(32),
      didRecoverySecret: randomBytes(32),
      issuerSecretScalar: randomScalar(),
      registryAddress: toHex(randomBytes(32)),
      licenses: [
        {
          licenseNumber: "CA-1",
          holderName: "Ada",
          holderDid: "did:midnight:offchain:x",
          category: 1,
          jurisdiction: "CA",
          issuedAtDay: 1,
          expiresAtDay: 2,
          leafIndex: 7n,
          statusHandleCommitment: randomBytes(32),
          revoked: false,
        },
      ],
    };
    const back = decodeJson<BoardState>(encodeJson(board));
    expect(back.issuerSecretScalar).toBe(board.issuerSecretScalar);
    expect(back.didControllerSecret).toEqual(board.didControllerSecret);
    expect(back.licenses[0]!.leafIndex).toBe(7n);
    const wire = decodeWire<BoardState>(encodeWire(board));
    expect(wire.licenses[0]!.statusHandleCommitment).toEqual(board.licenses[0]!.statusHandleCommitment);
    expect(fromHex(toHex(board.didControllerSecret))).toEqual(board.didControllerSecret);
  });

  it("converts dates to epoch days and back", () => {
    expect(isoDateToDays("1970-01-02")).toBe(1);
    expect(daysToIsoDate(20_700)).toBe("2026-09-04");
    expect(daysToIsoDate(isoDateToDays("2028-12-31"))).toBe("2028-12-31");
  });
});

describe("offchain holder DID", () => {
  it("derives a did:midnight:offchain long-form DID from a Jubjub key and resolves it back", () => {
    const scalar = randomScalar();
    const pk = publicKeyOf(scalar);
    const did = holderDidFromKey(pk);
    expect(did.startsWith("did:midnight:offchain:")).toBe(true);
    expect(did.split(":")).toHaveLength(5);
    expect(holderKeyFromDid(did)).toEqual(pk);
    const resolved = resolveHolderDid(did);
    expect(resolved.didDocument.id).toBe(did);
    expect(resolved.didDocument.assertionMethod?.length).toBe(1);
  });
});

describe("credential", () => {
  it("signs a credential the issuer key verifies and a presentation the holder key verifies", () => {
    const issuerScalar = randomScalar();
    const holderScalar = randomScalar();
    const claims = claimsFromInput({
      category: 1,
      jurisdiction: "CA",
      licenseNumber: "CA-4471",
      holderName: "Ada Lovelace",
      issuedAtDay: 20_000,
      expiresAtDay: 21_000,
    });
    const opening = randomBytes(32);
    const handle = newStatusHandle();
    const registryId = randomBytes(32);
    const credential = buildCredential({
      didContractAddress: toHex(randomBytes(32)),
      registryId,
      holderPublicKey: publicKeyOf(holderScalar),
      claimsCommitment: commitClaims(claims, opening),
      statusHandleCommitment: handle.commitment,
    });
    const sig = signCredential(issuerScalar, credential);
    expect(verifyCredential(publicKeyOf(issuerScalar), credential, sig)).toBe(true);
    expect(verifyCredential(publicKeyOf(randomScalar()), credential, sig)).toBe(false);

    const request = { challenge: randomBytes(32), requiredCategory: 1n, currentDay: 20_500n };
    const hs = signPresentation(holderScalar, request, registryId);
    expect(verifyJubjubDigest(publicKeyOf(holderScalar), presentationDigest(request, registryId), hs)).toBe(true);
  });
});
