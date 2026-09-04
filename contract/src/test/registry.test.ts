// Simulator tests for LicenseRegistry (compact-runtime 0.16.0, no network).
//
// The simulator mirrors midnight-did/packages/contract/src/test/did-simulator.ts:
// construct the contract with witnesses, thread a CircuitContext through calls, and read the ledger
// via the generated `ledger()` parser.
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import {
  type CircuitContext,
  type CircuitResults,
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
} from "@midnight-ntwrk/compact-runtime";
import {
  deriveJubjubPublicKey,
  JUBJUB_ORDER,
  signJubjubDigest,
} from "@midnight-ntwrk/midnight-did-jubjub-schnorr";
import { beforeAll, describe, expect, it } from "vitest";
import {
  Contract,
  ledger,
  pureCircuits,
  StatusType,
  type LicenseClaims,
  type LicenseCredential,
  type PresentationRequest,
  type Schnorr_SchnorrSignature,
} from "../managed/license-registry/contract/index.js";
import { CREDENTIAL_VERSION, ISSUER_METHOD_ID, pad32, padBytes, SCHEMA_ID } from "../constants.js";
import { emptyRegistryPrivateState, type RegistryPrivateState, witnesses } from "../witnesses.js";

setNetworkId("undeployed");

const randomBytes = (n: number): Uint8Array => crypto.getRandomValues(new Uint8Array(n));
const randomScalar = (): bigint => {
  let x = 0n;
  for (const b of randomBytes(32)) x = (x << 8n) | BigInt(b);
  return (x % (JUBJUB_ORDER - 1n)) + 1n;
};
const digest4 = (v: bigint[]): [bigint, bigint, bigint, bigint] => {
  if (v.length !== 4) throw new Error("digest must have 4 fields");
  return [v[0]!, v[1]!, v[2]!, v[3]!];
};

const DID_ADDRESS = randomBytes(32);
const TODAY = 20_700n; // days since epoch, arbitrary "today" for the tests

class RegistrySimulator {
  readonly contract = new Contract<RegistryPrivateState>(witnesses);
  readonly address = sampleContractAddress();
  ctx: CircuitContext<RegistryPrivateState>;

  constructor(readonly issuerScalar: bigint) {
    const { currentPrivateState, currentContractState, currentZswapLocalState } =
      this.contract.initialState(
        createConstructorContext({ issuerSecretScalar: issuerScalar }, "0".repeat(64)),
        { bytes: DID_ADDRESS },
        ISSUER_METHOD_ID,
      );
    this.ctx = createCircuitContext(
      this.address,
      currentZswapLocalState,
      currentContractState,
      currentPrivateState,
    );
  }

  ledger() {
    return ledger(this.ctx.currentQueryContext.state);
  }

  /** Runs a circuit and threads the resulting context forward. */
  private run<R>(fn: (ctx: CircuitContext<RegistryPrivateState>) => CircuitResults<RegistryPrivateState, R>): R {
    const result = fn(this.ctx);
    this.ctx = result.context;
    return result.result;
  }

  /** Replace the private state (e.g. to act as a party without the issuer secret). */
  as(privateState: RegistryPrivateState): this {
    this.ctx = createCircuitContext(
      this.address,
      this.ctx.currentZswapLocalState,
      this.ctx.currentQueryContext.state,
      privateState,
    );
    return this;
  }

  issue(handle: Uint8Array): bigint {
    const leafIndex = this.ledger().issuedCount;
    this.run((ctx) => this.contract.impureCircuits.issue(ctx, handle));
    return leafIndex;
  }

  revoke(index: bigint): void {
    this.run((ctx) => this.contract.impureCircuits.revoke(ctx, index));
  }

  present(args: {
    credential: LicenseCredential;
    issuerSignature: Schnorr_SchnorrSignature;
    claims: LicenseClaims;
    opening: Uint8Array;
    leafIndex: bigint;
    holderScalar: bigint;
    request: PresentationRequest;
    holderSignature?: Schnorr_SchnorrSignature;
  }): void {
    const L = this.ledger();
    const path = L.activeLicenses.pathForLeaf(args.leafIndex, args.credential.statusBinding.statusHandleCommitment);
    const presDigest = digest4(pureCircuits.presentationDigest(args.request, L.registryId));
    const holderSignature = args.holderSignature ?? signJubjubDigest(args.holderScalar, presDigest);
    this.run((ctx) =>
      this.contract.impureCircuits.present(
        ctx,
        args.credential,
        args.issuerSignature,
        args.claims,
        args.opening,
        path,
        holderSignature,
        args.request,
      ),
    );
  }
}

type IssuedLicense = {
  claims: LicenseClaims;
  opening: Uint8Array;
  credential: LicenseCredential;
  issuerSignature: Schnorr_SchnorrSignature;
  leafIndex: bigint;
  holderScalar: bigint;
};

const makeClaims = (overrides: Partial<LicenseClaims> = {}): LicenseClaims => ({
  category: 1n,
  jurisdiction: pad32("CA"),
  licenseNumber: pad32("CA-4471"),
  holderName: padBytes("Ada Lovelace", 64),
  issuedAtDay: TODAY - 400n,
  expiresAtDay: TODAY + 700n,
  ...overrides,
});

/** Issuer-side flow: build claims, commit, insert the status handle, sign the credential. */
const issueLicense = (sim: RegistrySimulator, holderScalar: bigint, claimOverrides: Partial<LicenseClaims> = {}): IssuedLicense => {
  const claims = makeClaims(claimOverrides);
  const opening = randomBytes(32);
  const claimsCommitment = pureCircuits.claimsCommitment(claims, opening);
  const handle = pureCircuits.statusHandleCommitment(randomBytes(32));
  const leafIndex = sim.as({ issuerSecretScalar: sim.issuerScalar }).issue(handle);
  const L = sim.ledger();
  const issuerRef = { didContractAddress: { bytes: DID_ADDRESS }, methodId: ISSUER_METHOD_ID };
  const credential: LicenseCredential = {
    version: CREDENTIAL_VERSION,
    schemaId: SCHEMA_ID,
    issuer: issuerRef,
    holderBinding: { holderPublicKey: deriveJubjubPublicKey(holderScalar) },
    statusBinding: {
      statusType: StatusType.revocationRegistry,
      registryRef: { registryId: L.registryId, authorityVerificationMethodRef: issuerRef },
      statusHandleCommitment: handle,
    },
    issuedAt: BigInt(Date.now()),
    claimsCommitment,
  };
  const issuerSignature = signJubjubDigest(sim.issuerScalar, digest4(pureCircuits.credentialDigest(credential)));
  return { claims, opening, credential, issuerSignature, leafIndex, holderScalar };
};

const requestFor = (category = 1n): PresentationRequest => ({
  challenge: randomBytes(32),
  requiredCategory: category,
  currentDay: TODAY,
});

describe("LicenseRegistry", () => {
  let issuerScalar: bigint;
  let holderScalar: bigint;

  beforeAll(() => {
    issuerScalar = randomScalar();
    holderScalar = randomScalar();
  });

  it("seals the issuer key and binds the registry to the issuer DID at deployment", () => {
    const sim = new RegistrySimulator(issuerScalar);
    const L = sim.ledger();
    expect(L.issuerPublicKey).toEqual(deriveJubjubPublicKey(issuerScalar));
    expect(L.issuerDidContract.bytes).toEqual(DID_ADDRESS);
    expect(L.issuerMethodId).toEqual(ISSUER_METHOD_ID);
    expect(L.issuedCount).toBe(0n);
    expect(L.revokedCount).toBe(0n);
    expect(L.registryId).toHaveLength(32);
  });

  it("issues a licence and lets the holder present it (happy path)", () => {
    const sim = new RegistrySimulator(issuerScalar);
    const lic = issueLicense(sim, holderScalar);
    expect(sim.ledger().issuedCount).toBe(1n);
    expect(lic.leafIndex).toBe(0n);

    const request = requestFor();
    // The holder has no issuer secret: present must work with an empty private state.
    sim.as(emptyRegistryPrivateState).present({ ...lic, request });

    const L = sim.ledger();
    expect(L.verifications.member(request.challenge)).toBe(true);
    expect(L.verifications.lookup(request.challenge)).toEqual({ category: 1n, currentDay: TODAY });
  });

  it("rejects issue and revoke from anyone but the issuer", () => {
    const sim = new RegistrySimulator(issuerScalar);
    const lic = issueLicense(sim, holderScalar);
    const impostor = randomScalar();
    expect(() => sim.as({ issuerSecretScalar: impostor }).issue(randomBytes(32))).toThrow(/Not the registry issuer/);
    expect(() => sim.as({ issuerSecretScalar: impostor }).revoke(lic.leafIndex)).toThrow(/Not the registry issuer/);
    expect(() => sim.as(emptyRegistryPrivateState).revoke(lic.leafIndex)).toThrow(/issuer secret scalar is required/);
  });

  it("revocation invalidates the licence: the current root no longer contains its leaf", () => {
    const sim = new RegistrySimulator(issuerScalar);
    const lic = issueLicense(sim, holderScalar);
    const before = sim.ledger().activeLicenses.root();

    sim.as({ issuerSecretScalar: issuerScalar }).revoke(lic.leafIndex);
    const L = sim.ledger();
    expect(L.revokedCount).toBe(1n);
    expect(L.activeLicenses.root()).not.toEqual(before);
    // The public tree no longer contains the handle: the holder cannot even build a path.
    expect(L.activeLicenses.findPathForLeaf(lic.credential.statusBinding.statusHandleCommitment)).toBeUndefined();

    // A stale path (computed before revocation) fails in-circuit against the current root.
    const stalePath = { leaf: lic.credential.statusBinding.statusHandleCommitment, path: [] as never[] };
    const request = requestFor();
    const presDigest = digest4(pureCircuits.presentationDigest(request, L.registryId));
    expect(() =>
      sim.contract.impureCircuits.present(
        sim.as(emptyRegistryPrivateState).ctx,
        lic.credential,
        lic.issuerSignature,
        lic.claims,
        lic.opening,
        { ...stalePath, path: L.activeLicenses.pathForLeaf(lic.leafIndex, new Uint8Array(32)).path.map((p) => ({ ...p })) },
        signJubjubDigest(holderScalar, presDigest),
        request,
      ),
    ).toThrow(/License is revoked or unknown/);
  });

  it("revoking one licence does not affect another holder's licence", () => {
    const sim = new RegistrySimulator(issuerScalar);
    const alice = issueLicense(sim, holderScalar);
    const bobScalar = randomScalar();
    const bob = issueLicense(sim, bobScalar, { licenseNumber: pad32("CA-9000"), holderName: padBytes("Bob", 64) });
    sim.as({ issuerSecretScalar: issuerScalar }).revoke(alice.leafIndex);

    const request = requestFor();
    sim.as(emptyRegistryPrivateState).present({ ...bob, request });
    expect(sim.ledger().verifications.member(request.challenge)).toBe(true);
  });

  it("rejects a presentation whose claims do not satisfy the request", () => {
    const sim = new RegistrySimulator(issuerScalar);
    const lic = issueLicense(sim, holderScalar); // category 1 = electrician
    expect(() => sim.as(emptyRegistryPrivateState).present({ ...lic, request: requestFor(2n) })).toThrow(
      /License category does not satisfy request/,
    );
    const expired = issueLicense(sim, holderScalar, { expiresAtDay: TODAY - 1n });
    expect(() => sim.as(emptyRegistryPrivateState).present({ ...expired, request: requestFor() })).toThrow(
      /License expired/,
    );
  });

  it("rejects a replayed challenge", () => {
    const sim = new RegistrySimulator(issuerScalar);
    const lic = issueLicense(sim, holderScalar);
    const request = requestFor();
    sim.as(emptyRegistryPrivateState).present({ ...lic, request });
    expect(() => sim.as(emptyRegistryPrivateState).present({ ...lic, request })).toThrow(/Challenge already answered/);
  });

  it("rejects a credential the issuer did not sign", () => {
    const sim = new RegistrySimulator(issuerScalar);
    const lic = issueLicense(sim, holderScalar);
    const forged = signJubjubDigest(randomScalar(), digest4(pureCircuits.credentialDigest(lic.credential)));
    expect(() =>
      sim.as(emptyRegistryPrivateState).present({ ...lic, issuerSignature: forged, request: requestFor() }),
    ).toThrow(/Invalid Jubjub Schnorr signature/);
  });

  it("rejects a presentation signed by someone other than the bound holder", () => {
    const sim = new RegistrySimulator(issuerScalar);
    const lic = issueLicense(sim, holderScalar);
    const request = requestFor();
    const thief = randomScalar();
    const presDigest = digest4(pureCircuits.presentationDigest(request, sim.ledger().registryId));
    expect(() =>
      sim.as(emptyRegistryPrivateState).present({
        ...lic,
        request,
        holderSignature: signJubjubDigest(thief, presDigest),
      }),
    ).toThrow(/Invalid Jubjub Schnorr signature/);
  });

  it("rejects tampered claims that do not open the commitment", () => {
    const sim = new RegistrySimulator(issuerScalar);
    const lic = issueLicense(sim, holderScalar, { category: 2n });
    // Holder lies about the category to satisfy an electrician request.
    const lied = { ...lic.claims, category: 1n };
    expect(() =>
      sim.as(emptyRegistryPrivateState).present({ ...lic, claims: lied, request: requestFor(1n) }),
    ).toThrow(/Claims do not open the credential commitment/);
  });

  it("rejects a credential bound to another registry or another issuer method", () => {
    // Note: the simulator has no real contract address, so `kernel.self()` (and therefore registryId)
    // is identical across simulated registries. The on-chain integration test checks that registryId
    // equals persistentHash(actual contract address); here we tamper with the binding directly.
    const sim = new RegistrySimulator(issuerScalar);
    const lic = issueLicense(sim, holderScalar);
    const foreign: LicenseCredential = {
      ...lic.credential,
      statusBinding: {
        ...lic.credential.statusBinding,
        registryRef: { ...lic.credential.statusBinding.registryRef, registryId: randomBytes(32) },
      },
    };
    const foreignSig = signJubjubDigest(issuerScalar, digest4(pureCircuits.credentialDigest(foreign)));
    expect(() =>
      sim.as(emptyRegistryPrivateState).present({ ...lic, credential: foreign, issuerSignature: foreignSig, request: requestFor() }),
    ).toThrow(/Registry mismatch/);

    const wrongMethod: LicenseCredential = {
      ...lic.credential,
      issuer: { ...lic.credential.issuer, methodId: pad32("#key-other") },
    };
    const wrongMethodSig = signJubjubDigest(issuerScalar, digest4(pureCircuits.credentialDigest(wrongMethod)));
    expect(() =>
      sim.as(emptyRegistryPrivateState).present({ ...lic, credential: wrongMethod, issuerSignature: wrongMethodSig, request: requestFor() }),
    ).toThrow(/Issuer method mismatch/);
  });
});
