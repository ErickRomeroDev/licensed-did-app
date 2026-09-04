# Licensed — Private, revocable professional-license credentials on `did:midnight`

**Status:** specification, September 2026 (revision 2: browser-only architecture), implemented 2026-09-03 — see
`README.md` for build/run/test status. This document is the rules-of-record for what was built, why it is built that
way, and what was proven.
**Audience:** the EDDA team, Midnight DevRel reviewers of the "Build with did:midnight" bounty claim, and
anyone who wants to adapt the application to another credential use case.
**Author:** Erick Romero ([@ErickRomeroEdda](https://x.com/ErickRomeroEdda)).
**Bounty:** *[Build for the ecosystem] Build with did:midnight* — Community, Involved, 60-day window,
14 days to deliver after the claim is validated.
**Design constraint (owner's decision):** this is a demonstration, not a product. **Nothing of ours runs
outside the browser.** No issuer service, no relayer, no proof server of ours. The deployed artifact is a
folder of static files. The only external pieces are public Midnight infrastructure (the preprod indexer),
the user's **1AM wallet extension** (node access, balancing, fee payment, submission, proving), and, as a
fallback, a proof server the user runs locally.
**Companion material:** the compiled contract sketch and compiler output referenced in §7 live in the session
scratchpad until the code phase starts; framework context in `docs/plans/components/RC17-identity-providers.md`
and `docs/plans/PROMISES.md` (RP11).

---

## 1. Purpose and bounty fit

**Licensed** is a small, complete, single-page application in which:

- a **licensing board** creates its own `did:midnight` identity and licence registry from its browser, then
  issues a professional-license credential to a practitioner,
- the **practitioner** holds the credential privately in their browser,
- a **hiring platform** learns exactly one thing — *this person holds an active licence in the category I asked
  for, issued by this board* — without ever receiving the credential, the licence number, or the name,
- the board can **revoke** the licence, and the hiring platform sees the change **without contacting the board**,
  because status is proven against a public on-chain registry root inside the practitioner's zero-knowledge proof.

| Bounty requirement | How Licensed meets it |
|---|---|
| Built on the Midnight DID reference implementation | The board's identity is a ledger `did:midnight` DID deployed from the browser with the reference implementation's contract and packages; the credential's issuer signature is verified in-circuit with the reference implementation's own Jubjub Schnorr module; the holder identity is an offchain long-form `did:midnight` DID from the method spec §2.1; issuer DIDs are resolved in-browser with the reference resolver |
| Holder proves something derived from a credential without handing it over | The presentation is a Midnight transaction whose circuit takes the credential, claims, openings and signatures as **private inputs** and writes only a boolean outcome keyed by the verifier's challenge |
| Full lifecycle: issue, hold, present, revoke | Four explicit flows (§8), each a screen action with an on-chain transaction (issue, present, revoke) or a public-state read (hold) |
| Revocation visible without contacting the issuer, before/after demonstrated | A `LicenseRegistry` contract keeps a Merkle tree of active credentials; revoking overwrites the leaf; the presentation circuit proves membership under the **current** root; after revocation no valid proof exists (§9) |
| Not "a UI around a copied DID example" | The reference implementation has **no** credential, status or revocation layer (§4). Licensed adds a credential family, a revocation registry contract, a ZK presentation protocol, and a browser port of the DID orchestration layer that upstream only ships for Node |
| Publicly deployed, usable by a stranger, clean-clone build under the supported Compact version | Static hosting, zero backend; a stranger needs the 1AM extension and preprod faucet funds (the standard Midnight dApp onboarding, documented with expected waits); compactc 0.31.1, the version pinned by midnight-did |
| Public, Apache-2.0, blockers filed | Layout in §12 designed for extraction to a standalone public repo; spikes in §13 name the issue each would produce |

---

## 2. Concepts primer

Readers who know DIDs and VCs can skip to §3.

**DID (Decentralized Identifier).** A URI such as `did:midnight:preprod:3f9c…` that resolves to a *DID
Document*: a JSON document listing public keys ("verification methods") and what each key may be used for
("relationships" such as `authentication` or `assertionMethod`). Whoever controls the keys controls the DID.

**`did:midnight`.** The Midnight DID method. Two flavours exist in the reference implementation:

- *Ledger DIDs* — one Compact smart contract per DID. The contract *is* the DID document: keys, relationships and
  services are ledger fields, and every change is a transaction authorised by the controller key. Costs a contract
  deployment; suits institutions.
- *Offchain long-form DIDs* — `did:midnight:offchain:<blake2s-hash>:<base64url-state>`. The DID string carries
  its own document (up to four keys and four services), so it resolves with no ledger lookup and costs nothing.
  Suits end users who need an identifier instantly.

**Verifiable Credential (VC).** A signed statement by an *issuer* about a *holder* ("this person holds
electrician licence CA-4471, valid until 2028"). The holder stores it; a *verifier* checks the issuer's
signature. In the classic model the holder shows the whole credential, which leaks every claim.

**Zero-knowledge presentation.** Instead of showing the credential, the holder produces a proof of a
statement *about* it — "I hold a credential from issuer X whose category claim equals `electrician`" — while
the credential, the claims and the signature stay private inputs to the proof. On Midnight, a proof is
attached to a transaction: the circuit runs locally over private inputs, the network verifies the proof, and
only the values the circuit explicitly `disclose()`s become public.

**Commitment.** `commit(value, opening)` is a hash that hides `value` until someone reveals `value` and the
random `opening`. Credentials in Licensed carry a commitment to the claims; the issuer signs the commitment, so
the signature covers the claims without exposing them.

**Credential status and revocation.** A credential is a signature, and signatures cannot be un-signed. So
"revocation" needs a second source of truth the verifier can check. The privacy problem is that checking
status usually means asking the issuer, which tells the issuer who is presenting where. Licensed makes status a
public **Merkle root** and has the holder prove membership *inside the zero-knowledge proof*: the verifier
learns "active under root R" and nothing more, and the issuer is never contacted.

**Merkle tree of active credentials.** A tree whose leaves are commitments to credential handles. Anyone can
read the tree from the indexer. A holder who knows their leaf and its index computes the sibling path and proves
that the path hashes to the current root. When the issuer overwrites a leaf, the root changes and that path is
dead. The tree is public but its leaves are commitments; the membership proof is zero-knowledge, so presenting
reveals nothing about *which* leaf is proven.

**Wallet-delegated proving.** Generating a Midnight proof needs a prover. In Licensed the dApp never talks to a
proof server itself: it asks the 1AM wallet for a *proving provider* through the standard dApp connector, and
the wallet proves with whatever backend the user configured (1AM's hosted ProofStation by default, or a local
proof server). The dApp ships its circuit keys as static files and hands them to the wallet on request.

---

## 3. Use case narrative

Three personas, three routes, one static web app, one wallet extension.

### 3.0 Before you start (shown as a checklist on the landing page)
1. Install the **1AM** wallet extension (Chrome or Firefox) and create a wallet.
2. Switch it to **preprod**.
3. Get test NIGHT from `https://faucet.preprod.midnight.network` (captcha in a new tab).
4. Wait until the wallet shows a **DUST** balance — DUST is the fee resource NIGHT generates after
   registration; first usable fees arrive within minutes, the full cap takes about a week.
5. Open `/board` to create a board, or `/wallet` to be a practitioner. A single wallet is enough to play every
   role on one machine; three browsers can also exchange the DID, credential-request and challenge strings.

### 3.1 The Board — `/board`
The State Electrical Licensing Board. First visit shows **Create board**: a four-step wizard that deploys the
board's `did:midnight` DID contract, publishes its Jubjub signing key as `#key-assert` with the
`assertionMethod` relationship, and deploys the board's `LicenseRegistry`. Each step is one transaction signed
in 1AM; the wizard shows progress and the resulting addresses, which are persisted in the browser. **Join
board** accepts existing addresses (read-only unless the board's secrets are present in this browser).

Once a board exists the screen shows a licence list with status chips **Active** / **Revoked**, a **New licence**
form (practitioner DID pasted or scanned; name, licence number, category, jurisdiction, issue and expiry dates),
a **Revoke** button per licence, and **Export / Import board** (secrets and licence ledger as a JSON file, so
the demo board can move between machines). The header shows the board's `did:midnight:preprod:…` and a
**Resolve** link that renders the DID document in-page, proving `#key-assert` equals the registry's sealed key.

### 3.2 The Practitioner — `/wallet`
A stranger clicks **Create my identity**. The browser generates a Jubjub key pair and derives an offchain
long-form `did:midnight:offchain:…`, shown as text and QR. No wallet connection is needed yet. After the board
issues, the wallet shows one **Licence card**: category, board name, expiry, and a live status chip computed
from the public registry tree (**Active** / **Revoked**). When a hiring platform asks for proof, the wallet
shows the request in plain words and a **Prove** button. Proving connects 1AM (first time only), asks it to
prove, balance and submit; the wallet prompts for approval and pays the fee. The screen ends with "Proof
accepted on-chain" and the transaction hash.

### 3.3 The Hiring Platform — `/verify`
A job board. **Request proof** creates a challenge (a QR / copyable code containing the challenge, the required
category and the current day). The screen polls the registry and flips from **Waiting** to **Verified — active
electrician licence, issued by State Electrical Licensing Board** with the transaction hash. A side panel shows
what the platform can observe on-chain: registry root, issued and revoked counters, and the verification records
for its own challenges. It never shows a name or licence number, because it never receives one. It needs no
wallet.

### 3.4 The demo storyline (also the video script)
1. Board creates itself (four approvals in 1AM). 2. Practitioner creates identity. 3. Board issues → card
shows **Active**. 4. Platform requests proof → practitioner proves → platform shows **Verified**.
5. Board revokes → card flips to **Revoked**; the platform's root and revoked counter change. 6. Platform
requests a fresh proof → the practitioner's wallet cannot build a valid proof ("Licence is revoked or
unknown") → the request stays **Waiting** and times out to **Not verified**. The platform never called the board.

---

## 4. What the reference implementation provides, and what Licensed adds

Verified against `midnightntwrk/midnight-did` at v0.6.0 (unreleased head, `218ec2f`), the published 0.5.0
packages on npm, the upstream VC packages, and the 1AM developer documentation.

### 4.1 Provided by `midnight-did`
- The `did:midnight` contract `packages/contract/src/did.compact` (pragma `>= 0.20`, compiled with
  **compactc 0.31.1**; stack `@midnight-ntwrk/midnight-js 4.0.2`, `ledger-v8 8.1.0`, `compact-runtime 0.16.0`,
  Node 24). Circuits: key rotation and recovery, add/update/remove verification methods (JSON Web Key and
  Schnorr-Jubjub), relationship sets, services, deactivate, and `verifySchnorrJubjubDigestSignature`.
- Published packages (0.5.0): `@midnight-ntwrk/midnight-did-contract` (generated contract, witnesses),
  `midnight-did` (resolver library `MidnightDIDResolver` with an injectable `ledgerReader`), `midnight-did-domain`
  (DID document model, offchain DID encoder `createLongFormOffchainMidnightDIDString`),
  `midnight-did-jubjub-schnorr` (Compact Schnorr module + TS signer), `midnight-did-api` (Node orchestration).
  ZK artifacts are released as a tarball in the exact layout `FetchZkConfigProvider` expects.
- A worked issuer bootstrap in Node: `packages/api/examples/bootstrap-issuer-did.ts` (Ed25519 `#key-auth` +
  Jubjub `#key-assert`). Licensed reproduces this flow in the browser (§8.0).

### 4.2 Explicitly *not* provided, and constraints discovered
- **No Verifiable Credential, presentation, status list or revocation registry.** `AGENT.md` line 108: *"Keep
  VC/VP semantics in `midnight-verifiable-credentials`."* The upstream VC core
  `@midnight-ntwrk/credential-compact@0.1.0-rc3` defines the vocabulary `RegistryBoundStatusBinding {
  statusType, registryRef, statusHandleCommitment }` but states *"this package does not authenticate registry
  mutation, roots, time, witnesses, or final non-membership"*. The only shipped credential family (digital
  passport) uses `NoStatusBinding`; its threat model row A4: *"Revoked credentials verify as valid."*
- **The DID API package is Node-only.** Its main entry imports `ws`, `node:fs`, `level`, `pino`; the `./browser`
  subpath exports only mappers (`DomainToRuntime`, `RuntimeToDomain`, `randomBytes`, `parseSeed`). Everything it
  orchestrates — contract, witnesses, digests, signer, resolver, domain — is browser-safe. Licensed ports the
  orchestration (§5.3).
- **A fresh in-tab seed wallet cannot cold-sync preprod.** Measured by the Passport team (2026-08-06): the walk
  from genesis reached 3% of ~1.98M blocks after 150 s while the tab's memory grew ~25 MB/s until it crashed at
  ~4.2 GB; the public indexer serves nothing that fast-forwards the commitment trees. This rules out an embedded
  wallet and is why Licensed uses the 1AM extension, which keeps its own synced state.
- **Hosted Midnight proof servers reject browser origins** (CORS 403), and **proofs cannot be verified
  off-chain with shipped packages**: the published `ledger-v8` WASM is built with contract-proof verification
  compiled out, `zkir-v2` exports only `prove`/`check`, and the proof server has no `/verify`. Presentation must
  therefore be an on-chain transaction, and proving must go through the wallet or a local proof server.
- **Public network reality (probed 2026-09-03):** `testnet-02` RPC is down; `preprod` runs node `1.0.2`;
  `preview` runs `1.0.1`; `stagenet` runs `2.0.0`, which the DID packages cannot talk to.

### 4.3 What Licensed adds
1. A minimal **credential family** for professional licences that reuses the upstream binding vocabulary.
2. A **`LicenseRegistry`** Compact contract: issuer-authorised issue and revoke over a Merkle tree of status
   handles, and a **`present`** circuit that verifies the issuer signature, opens the claims commitment, checks
   the predicate, proves current membership, verifies holder binding and records the outcome.
3. A **browser port of the DID orchestration layer** (create DID, add Schnorr-Jubjub method, add relationship,
   resolve) over the published contract/domain/resolver packages and the 1AM connector.
4. A **three-role static web application** with wallet-delegated proving and zero backend.

---

## 5. Architecture and trust boundaries

### 5.1 Topology
```
                 ┌───────────────────────────── preprod ─────────────────────────────┐
                 │  Board DID contract (did:midnight)      LicenseRegistry contract   │
                 │  #key-assert = Jubjub pk P              issuerPublicKey = P        │
                 │                                         activeLicenses: MerkleTree │
                 │                                         verifications: Map        │
                 └────────────▲──────────────────────────────────▲────────────────────┘
        read state (GraphQL)  │                                  │ signed, proven, balanced txs
  indexer.preprod.midnight.network                               │
                 ▲            │                                  │
                 │   ┌────────┴──────────────────────────────────┴───────┐
                 │   │        1AM wallet extension  (window.midnight['1am'])│
                 │   │  keys · NIGHT/DUST · balancing · submission         │
                 │   │  getProvingProvider → ProofStation or local prover  │
                 │   └──────────────────────────▲──────────────────────────┘
                 │                              │ dApp connector v4
        ┌────────┴──────────────────────────────┴──────────────────────────┐
        │   Licensed — static SPA (Vite + React), one origin                │
        │   /board    board secrets · licence ledger (IndexedDB)            │
        │   /wallet   holder key · offchain DID · HeldLicense (IndexedDB)   │
        │   /verify   challenges · polling                                  │
        │   /midnight/{did,license-registry}/keys|zkir  (static ZK assets)  │
        └───────────────────────────────────────────────────────────────────┘
```
Nothing else. No server of ours, no relayer, no proof server of ours. Optional: a proof server the user runs
locally (`http://localhost:6300`), selectable in settings when the wallet's proving provider is unavailable.

### 5.2 Roles and what they hold
| Component | Holds | Trust statement (goes in the README) |
|---|---|---|
| Board tab (browser) | DID controller + recovery secrets, registry issuer scalar, licence ledger (licence number → leaf index) in IndexedDB; export/import as JSON | The board's back office lives in the board operator's browser. Losing the browser profile without an export loses the ability to issue and revoke (the DID recovery key is exported too) |
| Practitioner tab | Jubjub key pair, offchain DID, `HeldLicense` bundle in IndexedDB | Nothing leaves the browser except the public key (issuance) and the proof (presentation) |
| 1AM wallet | The user's NIGHT/DUST keys; network configuration; proving backend | Balances, pays, signs and submits; **its proving backend sees the private inputs of every proof** (ProofStation hosted by 1AM, or the user's local proof server). This is the main residual trust and is stated plainly |
| Verifier tab | Challenges it generated | Reads the indexer only; never contacts the board |
| Indexer (Midnight public infra) | Public chain state | Read-only trust in the indexer's view of state, same as any Midnight dApp |

**Why no cross-contract call to the DID contract.** The 4.x stack has no contract-to-contract calls, so the
registry cannot read the issuer's DID document in-circuit. The registry seals the issuer's Jubjub public key
and DID contract address at deployment; the board and verifier screens resolve the DID in-browser and show that
`#key-assert` equals the sealed key. This is the same "compare method reference, resolve off-chain" split the
upstream credential family documents as the integrator's job.

### 5.3 Providers and the connector adapter (browser)
All `@midnight-ntwrk/midnight-js-*` at 4.0.2, `ledger-v8` 8.1.0, `dapp-connector-api` 4.0.x.

| Provider | Implementation |
|---|---|
| `publicDataProvider` | `indexerPublicDataProvider(cfg.indexerUri, cfg.indexerWsUri)` with URLs from `connected.getConfiguration()` |
| `zkConfigProvider` | `FetchZkConfigProvider('/midnight/<contract>', fetch)` — note the 4.0.2 constructor is `(baseURL, fetchFunc)` |
| `proofProvider` | `createProofProvider(await connected.getProvingProvider(zkConfigProvider))`; fallback `httpClientProofProvider(localProofServerUrl, zkConfigProvider)` |
| `privateStateProvider` | In-memory provider (from modular-starter) plus IndexedDB persistence of the board's two long-lived secrets |
| `walletProvider` / `midnightProvider` | Adapter over the connector: `balanceTx(tx)` → `balanceUnsealedTransaction(hex(tx.serialize()))` → deserialize; `submitTx(tx)` → `submitTransaction(hex)`; coin and encryption public keys from `getShieldedAddresses()` |

Files ported from `midnight-did/packages/api/src` with the Node parts swapped as above: `contract-instance`,
`providers`, `private-state`, `wallet-provider`, `controller-authorization`, `verification-method-operations`,
`contract-lifecycle-operations` (incl. the deploy interceptor for the "finalized but private state incomplete"
race), `resolution`. Dropped: `polyfills`, `logger-utils`, `package-paths`, `zk-artifacts` (artifacts are unpacked
at build time instead).

---

## 6. Data model

All structures are Compact structs (so hashing is identical in TypeScript via the generated `pureCircuits`) and
mirror the upstream `credential-compact` names where one exists.

### 6.1 Upstream-aligned bindings
```compact
export struct VerificationMethodRef { didContractAddress: ContractAddress, methodId: Bytes<32> }
export struct StatusRegistryRef      { registryId: Bytes<32>, authorityVerificationMethodRef: VerificationMethodRef }
export enum   StatusType             { none, revocationRegistry }   // see note on single-variant enums below
export struct RegistryBoundStatusBinding {
  statusType: StatusType,
  registryRef: StatusRegistryRef,
  statusHandleCommitment: Bytes<32>,   // the Merkle leaf
}
export struct HolderKeyBinding       { holderPublicKey: JubjubPoint }
```
**Why `StatusType` has two variants.** Upstream declares `enum StatusType { revocationRegistry }`. With compactc
0.31.1 + compact-runtime 0.16.0, a single-variant enum is allocated one circuit input by the compiler but encoded as
zero fields by the runtime, so the proof server rejects every transaction that carries one (`BadInput("Expected 61
inputs, received 60")` — found while running `present` on the standalone stack). Upstream never hit it because its
circuits are pure. Adding `none` (semantically the upstream `NoStatusBinding`) makes the enum one field wide on both
sides. Filed as a compiler/runtime issue (§13).

`HolderKeyBinding` replaces the upstream `ExplicitHolderBinding { holderVerificationMethodRef }` because an
offchain DID has no contract address. The holder's DID is derived from this key (§8.0), so the binding is by
construction; the credential carries the key, the wallet shows the DID.

### 6.2 Claims and credential
```compact
export struct LicenseClaims {
  category: Uint<8>,        // 1 electrician · 2 plumber · 3 gas fitter · 4 electrical inspector
  jurisdiction: Bytes<32>,  // pad(32, "CA")
  licenseNumber: Bytes<32>,
  holderName: Bytes<64>,
  issuedAtDay: Uint<32>,    // days since Unix epoch
  expiresAtDay: Uint<32>,
}

export struct LicenseCredential {
  version: Uint<16>,                       // 1
  schemaId: Bytes<32>,                     // pad(32, "edda:vc:professional-license:v1")
  issuer: VerificationMethodRef,           // issuer DID contract + pad(32, "#key-assert")
  holderBinding: HolderKeyBinding,
  statusBinding: RegistryBoundStatusBinding,
  issuedAt: Uint<64>,                      // unix ms
  claimsCommitment: Bytes<32>,             // persistentCommit<LicenseClaims>(claims, opening)
}
```
**One commitment, not five.** The digital-passport family commits each claim separately to allow revealing
some. Licensed's verifier never learns any claim value, only predicate results, so a single
`persistentCommit` over the whole struct is sufficient and halves the hashing in the circuit. Per-claim
commitments are listed as an extension in §15.

### 6.3 Browser-persisted state (IndexedDB, one store per role)
```ts
// Practitioner
type HolderIdentity = { secretScalar: bigint; publicKey: JubjubPoint; did: string /* did:midnight:offchain:… */ };
type HeldLicense = {
  credential: LicenseCredential;      // public envelope, never sent to a verifier
  claims: LicenseClaims;              // private
  claimsOpening: Uint8Array;          // 32 bytes, private
  issuerSignature: SchnorrSignature;  // { announcement: JubjubPoint, response: bigint }
  leafIndex: bigint;                  // position in activeLicenses; needed to build the path
  registryAddress: string;
  issuerDid: string;                  // did:midnight:preprod:…
};

// Board (exportable as one JSON file)
type BoardState = {
  network: 'preprod';
  didContractAddress: string;
  didControllerSecret: Uint8Array;    // 32 bytes — DID controller key seed
  didRecoverySecret: Uint8Array;      // 32 bytes — DID recovery key seed
  issuerSecretScalar: bigint;         // Jubjub scalar behind #key-assert and the registry issuer key
  registryAddress: string;
  licenses: Array<{ licenseNumber: string; leafIndex: bigint; statusHandleCommitment: Uint8Array;
                    holderDid: string; category: number; expiresAtDay: number; revoked: boolean }>;
};
```
The board file is a demo convenience, not a custody design; the README says so.

### 6.4 Presentation request and outcome
```compact
export struct PresentationRequest { challenge: Bytes<32>, requiredCategory: Uint<8>, currentDay: Uint<32> }
export struct VerificationRecord  { category: Uint<8>, currentDay: Uint<32> }
```
`currentDay` is verifier-supplied policy input (the same trust boundary the upstream age predicate documents):
the verifier states "as of day D", the circuit proves `expiresAtDay > D`. A malicious holder cannot change it
because it is hashed into the digest the holder must sign and is disclosed into the record.

---

## 7. The `LicenseRegistry` contract

One registry per board, deployed from the board's browser. The full source below **compiles with compactc
0.31.1** (`compact compile +0.31.1`, 3 circuits, 8.4 s wall-clock for the full ZK build; prover keys `present`
5.75 MB, `issue` 3.08 MB, `revoke` 3.08 MB; ZKIR instruction counts 323 / 141 / 135). The Schnorr module is
vendored verbatim from `midnight-did/packages/jubjub-schnorr/src/schnorr.compact` (Apache-2.0). The
`issuerSecretKey` witness is served by the board tab from `BoardState.issuerSecretScalar`.

```compact
pragma language_version >= 0.20;

import CompactStandardLibrary;
import "./schnorr" prefix Schnorr_;

export { Schnorr_SchnorrSignature };

// ---- vocabulary (§6.1) and family structs (§6.2, §6.4) elided here; identical to §6 ----

struct DomainTag { domain: Bytes<32> }

// ---------------------------------------------------------------- ledger
export sealed ledger issuerPublicKey: JubjubPoint;        // == issuer DID #key-assert
export sealed ledger issuerDidContract: ContractAddress;  // the issuer's did:midnight contract
export sealed ledger issuerMethodId: Bytes<32>;           // pad(32, "#key-assert")
export sealed ledger registryId: Bytes<32>;               // persistentHash(kernel.self())
export ledger activeLicenses: MerkleTree<8, Bytes<32>>;   // leaves = statusHandleCommitment
export ledger issuedCount: Counter;
export ledger revokedCount: Counter;
export ledger verifications: Map<Bytes<32>, VerificationRecord>;  // challenge -> outcome

witness issuerSecretKey(): Field;   // getSchnorrReduction is declared inside the schnorr module

constructor(issuerDid: ContractAddress, methodId: Bytes<32>) {
  issuerPublicKey = disclose(ecMulGenerator(issuerSecretKey()));
  issuerDidContract = disclose(issuerDid);
  issuerMethodId = disclose(methodId);
  registryId = persistentHash<ContractAddress>(kernel.self());
}

// ---------------------------------------------------------------- digests
export pure circuit credentialDigest(credential: LicenseCredential): Vector<4, Field> {
  return [
    transientHash<DomainTag>(DomainTag { domain: pad(32, "edda:vc:license:issue:v1") }),
    transientHash<Bytes<32>>(credential.statusBinding.registryRef.registryId),
    transientHash<LicenseCredential>(credential),
    0 as Field,
  ];
}

export pure circuit presentationDigest(request: PresentationRequest, registry: Bytes<32>): Vector<4, Field> {
  return [
    transientHash<DomainTag>(DomainTag { domain: pad(32, "edda:vc:license:present:v1") }),
    transientHash<Bytes<32>>(registry),
    transientHash<PresentationRequest>(request),
    0 as Field,
  ];
}

// ---------------------------------------------------------------- issuer authorization
// Zero-knowledge proof of knowledge of the issuer's Jubjub secret scalar.
circuit assertIssuer(): [] {
  const pk = ecMulGenerator(issuerSecretKey());
  assert(disclose(jubjubPointX(pk) == jubjubPointX(issuerPublicKey)), "Not the registry issuer");
  assert(disclose(jubjubPointY(pk) == jubjubPointY(issuerPublicKey)), "Not the registry issuer");
}

// ---------------------------------------------------------------- lifecycle
export circuit issue(statusHandleCommitment: Bytes<32>): [] {
  assertIssuer();
  assert(!activeLicenses.isFull(), "Registry is full");
  activeLicenses.insert(disclose(statusHandleCommitment));   // leaf index = issuedCount before this call
  issuedCount.increment(1);
}

export circuit revoke(index: Uint<64>): [] {
  assertIssuer();
  activeLicenses.insertIndexDefault(disclose(index));        // tombstone: root changes, old path dies
  revokedCount.increment(1);
}

export circuit present(
  credential: LicenseCredential,
  issuerSignature: Schnorr_SchnorrSignature,
  claims: LicenseClaims,
  claimsOpening: Bytes<32>,
  statusPath: MerkleTreePath<8, Bytes<32>>,
  holderSignature: Schnorr_SchnorrSignature,
  request: PresentationRequest
): [] {
  // 1. bound to this registry and its issuer
  assert(credential.version == 1, "Unsupported credential version");
  assert(credential.schemaId == pad(32, "edda:vc:professional-license:v1"), "Unknown credential schema");
  assert(credential.issuer.didContractAddress.bytes == issuerDidContract.bytes, "Issuer DID mismatch");
  assert(credential.issuer.methodId == issuerMethodId, "Issuer method mismatch");
  assert(credential.statusBinding.statusType == StatusType.revocationRegistry, "Unsupported status type");
  assert(credential.statusBinding.registryRef.registryId == registryId, "Registry mismatch");

  // 2. the issuer signed it (Jubjub Schnorr, verified in-circuit)
  Schnorr_schnorrVerifyDigest(credentialDigest(credential), issuerSignature, issuerPublicKey);

  // 3. the private claims open the commitment
  assert(persistentCommit<LicenseClaims>(claims, claimsOpening) == credential.claimsCommitment,
         "Claims do not open the credential commitment");

  // 4. the predicate the verifier asked for
  assert(claims.category == request.requiredCategory, "License category does not satisfy request");
  assert(claims.expiresAtDay > request.currentDay, "License expired");

  // 5. status: still a leaf of the active set under the CURRENT root
  assert(statusPath.leaf == credential.statusBinding.statusHandleCommitment, "Status path is for another credential");
  assert(activeLicenses.checkRoot(disclose(merkleTreePathRoot<8, Bytes<32>>(statusPath))),
         "License is revoked or unknown");

  // 6. holder binding: the presenter controls the key bound into the credential
  Schnorr_schnorrVerifyDigest(presentationDigest(request, registryId), holderSignature,
                              credential.holderBinding.holderPublicKey);

  // 7. record the outcome; one answer per challenge
  const challenge = disclose(request.challenge);
  assert(!verifications.member(challenge), "Challenge already answered");
  verifications.insert(challenge, VerificationRecord {
    category: disclose(request.requiredCategory),
    currentDay: disclose(request.currentDay),
  });
}
```

### 7.1 Disclosure map — what each circuit publishes
| Circuit | Public (disclosed) | Private (never leaves the prover) |
|---|---|---|
| constructor | issuer public key, issuer DID address, method id, registry id | issuer secret scalar |
| `issue` | leaf hash of the status handle commitment (Merkle insert hides the value itself), new root, count | issuer secret scalar |
| `revoke` | leaf **index** being tombstoned, new root, count | issuer secret scalar |
| `present` | Merkle **root** (equal to the public current root, so zero new information), challenge, required category, current day | credential, claims, opening, issuer signature, Merkle path and leaf, holder signature, holder public key |

Two compiler lessons from compiling this sketch, kept as design rules: (1) an `assert` on a witness-derived
comparison that gates a ledger write must disclose its boolean; (2) `a && b` short-circuits and therefore
*branches* on `a`, so disclose each comparison separately rather than the conjunction.

### 7.2 Design choices and rejected alternatives
- **Plain `MerkleTree`, not `HistoricMerkleTree`.** Historic roots would let a revoked holder keep proving
  against the root from before revocation. Only the current root may validate. Consequence: every issue or
  revoke changes the root, so the holder refreshes its path from the indexer right before proving (§8.3).
- **Tombstone via `insertIndexDefault`, not a public revoked-set.** A `Set<Bytes<32>>` of revoked ids would
  force the holder to disclose its id for a non-membership check, making every presentation linkable. The
  Merkle design discloses nothing per presentation and only a leaf index per revocation.
- **Issuer authorisation by proof of knowledge, not by signature.** midnight-did signs an authorisation digest so
  anyone can submit; in Licensed the board tab is also the submitter, so proving knowledge of the secret in the
  witness is simpler and equally sound. The same Jubjub key is the DID's `#key-assert`, matching upstream's
  `authorityVerificationMethodRef`.
- **Depth 8 (256 licences).** Enough for a demo; depth is a compile-time constant and a README knob.
- **Outcome keyed by challenge.** The verifier owns the challenge, so it can poll exactly one map entry. A
  replay of the same proof is rejected because the entry exists; a fresh challenge forces a fresh proof against
  the current root — which is precisely what makes revocation observable.

---

## 8. Protocol flows

Legend: **B** board tab · **H** practitioner tab · **V** verifier tab · **W** 1AM wallet (and its proving
backend) · **L** ledger (preprod) · **X** indexer.

### 8.0 Identity bootstrap
**Board wizard (B, four transactions, each approved in W):**
1. **Create DID.** `initPrivateState()` → `{secretKey, recoverySecretKey}` (Web Crypto random); `deployContract`
   of the published DID contract with that initial private state (the constructor discloses the controller and
   recovery Jubjub keys from witnesses). Persist secrets + address in `BoardState`.
2. **Publish the signing key.** Generate `issuerSecretScalar`; `#key-assert` = its Jubjub public key.
   Digest = `DIDContract.pureCircuits.setSchnorrJubjubVerificationMethodAuthorizationDigest(id, version, method,
   MapMutation.Insert)`; controller signature = `signJubjubDigestFromSeed(secretKey, digest)`; call
   `setSchnorrJubjubVerificationMethod(method, Insert, signature, version)`.
3. **Mark it `assertionMethod`.** Digest = `setVerificationMethodRelationAuthorizationDigest(id, version,
   assertionMethod, "#key-assert", SetMutation.Insert)`; sign; call `setVerificationMethodRelation(...)`.
4. **Deploy the registry.** `deployContract(LicenseRegistry, args: (didContractAddress, pad("#key-assert")))`
   with `issuerSecretKey` witness = `issuerSecretScalar`. Persist `registryAddress`.
   *Time-box fallback:* if steps 2–3 prove troublesome in the browser, sign credentials with the DID
   **controller** key instead (two transactions total) and document the deviation.

**Holder (H, no transaction):** generate Jubjub scalar → public key → offchain state `{ version: 1,
verificationMethod: [{ id: "#key-1", publicKeyJwk: { kty: "EC", crv: "Jubjub", x, y }, relationships: {
authentication: true, assertionMethod: true } }] }` → `createLongFormOffchainMidnightDIDString(state)`. Shown as
text and QR.

### 8.1 Issue
1. Practitioner shares `holderDid` (paste or QR) with the board clerk, who fills the licence form (**B**).
2. **B** resolves `holderDid` locally (offchain, no network) and extracts `holderPublicKey`.
3. **B** builds `claims`, random `claimsOpening`, `claimsCommitment = persistentCommit(claims, opening)`; random
   `statusHandleCommitment = persistentHash([tag, random32])`; `credential` per §6.2.
4. **B** signs `pureCircuits.credentialDigest(credential)` with `issuerSecretScalar` (`signJubjubDigest`).
5. **B → W → L** `issue(statusHandleCommitment)`; `leafIndex = issuedCount` read from **X** immediately before;
   on finality append to `BoardState.licenses`.
6. **B → H** the bundle `{ credential, claims, claimsOpening, issuerSignature, leafIndex, registryAddress,
   issuerDid }` as a copyable string / QR (same machine: a "Send to practitioner tab" button via
   `BroadcastChannel`). **H** stores it as `HeldLicense`. Nothing about the licence is written anywhere but the
   two browsers.

### 8.2 Hold
**H ← X** reads registry state; `findPathForLeaf(commitment)` returns a path → **Active**; returns nothing → **Revoked**
(`pathForLeaf(index, leaf)` builds a path for any leaf value; only the circuit's `checkRoot` rejects a stale one). The card shows category, board name (from resolving `issuerDid` through the
in-browser resolver), expiry.

### 8.3 Present
1. **V** generates `challenge = random32`, `requiredCategory`, `currentDay = today`; displays a code; polls
   `verifications[challenge]` through **X**.
2. **H** receives the request (paste/scan), shows it in plain words; user clicks **Prove**.
3. **H** connects **W** (`window.midnight['1am'].connect('preprod')`), reads `getConfiguration()`, builds the
   providers of §5.3.
4. **H ← X** fetch current registry state → `statusPath = activeLicenses.pathForLeaf(leafIndex, commitment)`.
5. **H** signs `pureCircuits.presentationDigest(request, registryId)` with the holder scalar → `holderSignature`.
6. **H** runs the standard call pipeline: unproven `present(...)` tx → `proofProvider.proveTx` (the wallet's
   proving provider, keys fetched from `/midnight/license-registry/`) → `walletProvider.balanceTx`
   (`balanceUnsealedTransaction`, **W** adds the fee inputs and prompts the user) → `midnightProvider.submitTx`.
7. **V** sees `verifications[challenge] = { category, currentDay }` → **Verified** with the tx hash.

### 8.4 Revoke
1. Clerk clicks **Revoke** on licence N. **B → W → L** `revoke(leafIndex)`.
2. Root changes; `revokedCount` increments. **H** (on next poll) shows **Revoked**. **V** side panel shows the
   new root and counter.
3. Any new **present** attempt fails locally at step 6 with "License is revoked or unknown" before anything is
   sent to the wallet. The verifier's new challenge is never answered.

---

## 9. Revocation model — what the verifier can establish

| Moment | Verifier asks | Verifier observes on-chain | Did it contact the issuer? |
|---|---|---|---|
| Before revocation | fresh challenge C1 | `verifications[C1]` appears within seconds: *active `electrician` licence from this issuer as of day D* | No |
| Issuer revokes | — | registry root changes; `revokedCount` +1; a `revoke(index)` transaction is visible | No |
| After revocation | fresh challenge C2 | `verifications[C2]` never appears; the practitioner's wallet cannot generate a proof | No |
| Old record C1 | — | Still present: it is a true statement *about day D under the root at that time*. The verifier UI labels records with the root they were proven under and warns that only a fresh challenge reflects current status | No |

**Why this is sound.** Status is a property of the current Merkle root, and the root is public and
issuer-controlled but *issuer-independent to read*. The verifier trusts the chain, not the issuer's
availability. The holder cannot forge membership because the path must hash to a root the contract compares
against its own state inside the proof.

**What it does not do.** It cannot tell the verifier *why* a proof did not arrive (holder declined vs.
revoked vs. offline). That indistinguishability is the privacy property, not a defect, and the README says so.

---

## 10. Privacy analysis

| Step | Board learns | 1AM wallet / its prover learns | Verifier learns | Chain shows |
|---|---|---|---|---|
| Identity | nothing until issuance | — | — | nothing (offchain DID) |
| Issue | everything (it is the source) | the `issue` tx (public parts) and the board's `issuerSecretKey` witness while proving | — | one hidden leaf insert (leaf hash), new root |
| Hold | — | — | — | — (read-only polling of public state) |
| Present | **nothing** — not contacted | **all private inputs** of the proof (prover), plus the fee inputs it spends | one boolean fact per challenge; not *which* leaf, holder key, name or number | challenge, category, day, root (already public), **and the holder wallet's fee inputs** |
| Revoke | acts | the `revoke` tx | root changed, count +1 | which **index** was tombstoned |

**Linkability.** The presentation *content* carries no stable identifier: the challenge is verifier-random, the
disclosed root is common to all holders, and the holder key never leaves the circuit. Two consequences of the
"holder pays" decision are stated in the README: (1) the wallet's proving backend (ProofStation or a local
proof server) sees the private inputs — production holders would run their own prover; (2) the fee inputs of
each presentation belong to the holder's wallet, so a chain observer can link presentations to that wallet even
though they cannot link them to a credential. Extensions in §15 remove both (verifier-pays relaying,
ProofStation fee sponsorship, in-browser WASM proving).

---

## 11. Deployment

| Piece | Where | Notes |
|---|---|---|
| Web app | Static hosting on an eddalabs domain (same pattern as the modular-starter live demo) | Ships `/midnight/license-registry/{keys,zkir}` (our compiled circuits) and `/midnight/did/{keys,zkir}` (the midnight-did 0.5.0 ZK artifact tarball, unpacked at build time) so `FetchZkConfigProvider` and the wallet's `KeyMaterialProvider` can fetch them |
| Contracts | preprod, deployed **by each board from its browser** | The demo board's addresses are listed in the README and pre-filled in **Join board** so a stranger can hold and verify against it immediately; issuing on the demo board needs its exported `BoardState` file |
| Wallet | 1AM extension on preprod | Faucet `https://faucet.preprod.midnight.network`; DUST wait documented |
| Proving | Wallet-delegated via `getProvingProvider`; optional local proof server URL in settings | No hosted prover of ours. If the connector's proving proxy is unusable in a given wallet version, the settings panel accepts `http://localhost:6300` (docker `midnightntwrk/proof-server` matching the preprod ledger line) |
| Local test stack (not part of the application) | `infra/standalone.yml`: Midnight's own blockchain node, indexer and proof server as docker containers, used only by automated tests (`contract/` simulator tests and `deploy/` integration scripts that drive the contract with the reference implementation's test wallet) | Developer machine and CI only; nothing from it is deployed and the web app never talks to it. 1AM does not support the `undeployed` network, so the browser app is exercised on preprod (or preview) |

**Wallet / prover configuration assumptions (bounty program defaults; to be replaced by the program's text
when available).** No seeds, keystores or board files in the repo. No prover of ours; the README documents the
wallet's proving options and the trust they imply. Faucet and DUST steps documented with expected waits. The
README states which component holds which key (§5.2) and how to run tests locally on the standalone stack.

---

## 12. Repository layout and clean-clone build

Designed so the experiment folder is copied verbatim into a new public `eddalabs/licensed-did-midnight` repo.

```
did-vc-flow/                          → repo root after extraction
  LICENSE                             Apache-2.0
  README.md                           setup · architecture/use case · how to adapt · trust statement
  spec.md                             this document
  package.json · pnpm-workspace.yaml · .nvmrc (24) · turbo.json
  contract/                           @licensed/contract
    src/license-registry.compact      §7
    src/schnorr.compact               vendored from midnight-did (header + NOTICE kept)
    src/witnesses.ts                  issuerSecretKey, getSchnorrReduction (copied pattern from midnight-did)
    src/test/*.test.ts                simulator tests: issue/revoke/present happy path, revoked path fails,
                                      wrong category fails, replayed challenge fails, forged signature fails
    package.json                      "compact": "compact compile +0.31.1 src/license-registry.compact src/managed/license-registry"
  shared/                             @licensed/shared — types, codecs, digest helpers (pureCircuits),
                                      offchain DID helpers (wraps midnight-did-domain), day math, BoardState/HeldLicense schemas
  web/                                @licensed/web — Vite + React, the only deployed artifact
    src/routes/board · wallet · verify
    src/midnight/connector/           1AM detection, connect, WalletProvider/MidnightProvider adapter, proof provider selection
    src/midnight/providers.ts         indexer + FetchZkConfigProvider + in-memory/IndexedDB private state
    src/midnight/did/                 ported midnight-did orchestration (create, key ops, resolve)
    src/midnight/registry/            LicenseRegistry deploy/issue/revoke/present wrappers
    src/storage/                      IndexedDB stores, board export/import
    public/midnight/license-registry/ our keys + zkir, copied at build
    public/midnight/did/              midnight-did 0.5.0 artifacts, unpacked at build
    scripts/fetch-did-artifacts.mjs   downloads + verifies the tarball (sha256 from the release manifest)
  deploy/                             automated tests only: drives issue/present/revoke against the local docker
                                      stack with the reference implementation's test wallet; never deployed
  infra/standalone.yml                docker: Midnight blockchain node + indexer + proof server, tests only
```

**Clean-clone build (README, verified in CI):**
```
nvm use 24 && corepack enable
compact update 0.31.1
pnpm install
pnpm -r compact          # compiles the registry
pnpm -r build            # includes fetch-did-artifacts + key copy into web/public
pnpm -r test             # simulator tests, no network
```
CI: GitHub Actions on Node 24 running exactly the block above, pinning `COMPACT_COMPILER_VERSION: 0.31.1` like
midnight-did's workflows. This is the "evidence that the application builds from a clean clone".

---

## 13. Unknowns, spikes, and issues to file

Run in this order before any product code. Each spike has a pass condition, a fallback, and the issue we file
upstream if it fails.

| # | Spike | Pass | Fallback | Issue to file if it fails |
|---|---|---|---|---|
| S1 | **1AM on preprod end to end**: connect, `getConfiguration`, `getProvingProvider(FetchZkConfigProvider)` proves a `LicenseRegistry` call, `balanceUnsealedTransaction` + `submitTransaction` finalize it | `issue()` finalizes from a Vite dev page | Local proof server via `httpClientProofProvider`; if balancing fails, test on preview | 1AM (webisoft) if the proving proxy lacks `check` or rejects our key provider; midnight-js if `createProofProvider` + connector types mismatch |
| S2 | **DID from the browser**: deploy DID contract with `@midnight-ntwrk/midnight-did-contract@0.5.0` + 0.5.0 artifacts via the connector; then `setSchnorrJubjubVerificationMethod` + `setVerificationMethodRelation`; resolve with `MidnightDIDResolver` over the indexer | DID document shows `#key-assert` with `assertionMethod` | Controller-key-as-issuer (2 txs) | midnight-did: browser-consumable orchestration missing from the API package (`./browser` exports only mappers); artifact/manifest mismatch if any |
| S3 | **Registry semantics** in the simulator: `insertIndexDefault(i)` invalidates the path for leaf *i*, other leaves still pass, replayed challenge rejected; measure `present` proving time on the standalone proof server | Tests green; proof < 60 s | Reduce depth | compact: only if `insertIndexDefault` behaves unexpectedly |
| S4 | **Fresh 1AM wallet funding**: faucet → NIGHT → DUST registration → first `present` fee | Documented wait ≤ 15 min | Pre-funded demo instructions | Midnight docs: missing preprod faucet/DUST guidance |
| S5 | **Offchain DID round trip** with `midnight-did-domain` 0.5.0 in the browser (JWK `x`/`y` from `JubjubPoint`) | `resolveLongFormOffchainMidnightDID` returns the key | Implement encoder per method spec §2.1.1 | midnight-did: only if the domain package fails to bundle |
| S6 | **Bundling**: `midnight-js-contracts@4.0.2` stray `import 'fs'/'path'`, `FetchZkConfigProvider` 4.0.2 constructor, WASM in Vite | Dev build runs | Aliases per the album-gameplay `vite.config.ts` | midnight-js: stray Node imports in the browser bundle |

Found during implementation (2026-09-03, standalone stack): (a) **indexer-standalone 4.0.x cannot follow node 1.0.x**
(`unsupported protocol version 1000000`) — the local test stack runs node 0.22.2, the line midnight-did's compose uses;
(b) **single-variant enums break proving** on compactc 0.31.1 + compact-runtime 0.16.0 (IR expects one input, runtime
sends none) — issue to file against `midnightntwrk/compact` / compact-runtime with the minimal repro in §6.1.

Already answered during this spec: compactc 0.31.1 compiles the registry with the vendored Schnorr module;
`MerkleTree` exposes `insertIndexDefault`, `isFull`, `checkRoot`; the offchain DID encoder exists upstream;
off-chain proof verification is not possible with shipped packages (documented, not a blocker).

---

## 14. Build plan (14 days after claim validation)

| Days | Deliverable |
|---|---|
| 1–3 | S1, S2, S6 on preprod from a throwaway Vite page. Go/no-go on wallet-delegated proving and browser DID creation. Issues filed as found |
| 4 | `contract/` with simulator tests (S3 becomes the suite); `shared/` codecs, digest helpers, storage schemas |
| 5–7 | `web/src/midnight/{connector,providers,did}`: connector adapter, ported DID orchestration, board wizard, resolver view |
| 8–9 | Board issue/revoke, practitioner identity/hold/present, verifier challenge/poll; storyline runs on preprod |
| 10 | Static deployment; demo board created from the deployed site; README draft |
| 11–12 | README (setup, architecture, adapt guide, trust statement), CI clean-clone workflow, LICENSE, NOTICE |
| 13 | Demo video (storyline §3.4), extraction to the public repo, tag `v0.1.0` |
| 14 | Buffer; submission with links to issues filed |

Check-in evidence at day 5: pushed branch with compiled contract, passing simulator tests, and S1/S2 results.

---

## 15. Out of scope and extensions

- **Out of scope (v1):** multiple issuers per registry; per-claim selective disclosure; nullifier-scoped
  "one presentation per verifier" limits; issuer key rotation (a rotated `#key-assert` would require a new
  registry or a `rotateIssuerKey` circuit); mobile; production custody of board secrets.
- **Natural extensions:**
  - *Fee privacy for holders* — either the verifier balances and submits the holder's proven transaction
    (the prove → balance → submit pipeline splits cleanly, and 1AM exposes `submitTransaction` as a relayer
    call), or 1AM's ProofStation `/balance-only` sponsorship pays the fee. Both remove the fee-input linkage
    noted in §10.
  - *In-browser WASM proving* — validated by the Passport team on this ledger line (`zkir-v2` prover in a
    worker, proof server stopped); removes the prover's view of private inputs at the cost of a 30–50 MB
    download and 4–45 s per proof.
  - *Off-chain verification* — a small Rust→WASM crate over `midnight-ledger`'s `VerifierKey::verify` would let
    a verifier check a proven, unsubmitted transaction locally; the verifier SRS is already embedded upstream.
    Blocked today only by the published WASM being built without contract-proof verification.
  - Per-claim commitments; a richer verifier policy struct; migrating the family onto
    `@midnight-ntwrk/credential-compact` once its registry package exists (vocabulary already aligned); reusing
    `LicenseRegistry` as the RC17 "framework-run membership scheme" behind the RWA framework's compliance hooks.

---

## Appendix A — Acceptance criteria mapping

| Criterion (verbatim) | Mechanism | Where observable |
|---|---|---|
| The application demonstrates the full lifecycle: issue, hold, present, and revoke | §8.1–8.4; each is a screen action with an on-chain transaction (issue, present, revoke) or public-state read (hold) | `/board`, `/wallet`, `/verify` |
| The holder proves an assertion without handing the underlying credential to the verifier | `present` takes credential, claims, signatures as private inputs; only `{category, currentDay}` keyed by challenge is disclosed (§7.1) | `/verify` shows only the outcome; the verifier tab receives no message from the holder at all — it reads the chain |
| Revocation is visible to the verifier without contacting the issuer, with before/after states demonstrated | Current-root Merkle membership inside the proof; §9 table; verifier polls the indexer only | `/verify` side panel: root, counters, records |
| Publicly deployed, usable by a stranger, builds from a clean clone under the supported Compact version | Static deployment with zero backend; stranger needs the 1AM extension and faucet funds (documented); compactc 0.31.1 pinned; CI clean-clone job (§11–12) | deployed URL; GitHub Actions run |
| Repo is public and Apache-2.0, with relevant blockers filed as Midnight issues | Extracted repo with LICENSE; §13 issue list linked in README and submission | GitHub |
| README and wallet/prover configuration meet the bounty requirements | §11 assumptions; README trust statement; no prover or keys of ours | README |
| Substance bar: meaningful use case, privacy and revocation observable in the deployed experience | Licensing is a real revocation-heavy domain; the storyline §3.4 makes both properties visible without reading code; the DID orchestration port and the registry are new code on top of the reference implementation | demo video |

## Appendix B — Claim comment (draft for the bounty thread)

> **What we plan to build.** *Licensed*: a browser-only, three-role web app on `did:midnight` where a licensing
> board creates its own DID and licence registry from the browser, issues a professional-licence credential to a
> practitioner's DID, the practitioner proves "active licence in category X from board B" to a hiring platform in
> zero knowledge, and the board can revoke with the change visible to the platform without contacting the board.
>
> **How it meets the core goal.** The credential never reaches the verifier: the presentation is a Midnight
> transaction whose circuit verifies the board's Jubjub Schnorr signature (the reference implementation's own
> module), opens a commitment to the claims, checks the predicate, proves Merkle membership of the credential's
> status handle under the registry's *current* root, verifies holder key binding to a verifier challenge, and
> discloses one boolean outcome. Revocation overwrites the leaf; the next proof cannot be built. Before/after is
> shown live in the verifier screen, which reads only the indexer.
>
> **Approach / technologies.** midnight-did 0.5.0 packages (contract, domain, resolver, jubjub-schnorr) on the
> ledger-v8 / midnight-js 4.0.2 / compactc 0.31.1 line; a browser port of the DID orchestration the API package
> ships only for Node; a new `LicenseRegistry` Compact contract (MerkleTree status registry + `present` circuit)
> aligned with the `RegistryBoundStatusBinding` vocabulary of `@midnight-ntwrk/credential-compact`; holder as
> offchain long-form `did:midnight`; Vite/React static site; **1AM wallet** via dApp connector v4 for keys, fees,
> submission and wallet-delegated proving; preprod. No backend, relayer or proof server of ours.
>
> **Dependencies / collaborators.** EDDA Labs team. Depends on 1AM's connector proving path on preprod (spike on
> day 1; fallback local proof server, issues filed to 1AM / midnight-js / midnight-did as found).
>
> **Prior work.** EDDA's Midnight modular starter (cross-contract calls, events, dual-key accounts, embedded
> passkey wallet, live at template.preview.eddalabs.io) and the RWA framework's identity-provider design
> (Merkle membership eligibility schemes). Not funded by any Midnight channel; not a Fellowship contribution;
> not an extension of a listed dApp.

## Appendix C — References

- Reference implementation: `github.com/midnightntwrk/midnight-did` — `packages/contract/src/did.compact`,
  `packages/jubjub-schnorr/src/schnorr.compact`, `packages/api/src/{providers,private-state,verification-method-
  operations,controller-authorization,contract-lifecycle-operations,resolution}.ts` (ported),
  `packages/api/examples/bootstrap-issuer-did.ts`, `packages/api/src/release-artifacts.ts` (artifact layout),
  `w3c-spec/midnight-method.md` §2.1 (offchain DIDs), `docs-site/use-cases/deferred.md`,
  `docs/production-readiness-backlog.md`.
- 1AM wallet: `https://1am.xyz/developers` (`window.midnight['1am']`, connector v4.0.0, `getProvingProvider`,
  `balanceUnsealedTransaction`, `submitTransaction`, networks preview/preprod/mainnet, ProofStation gateway
  `api-preprod.1am.xyz`); Chrome Web Store id `bphnkdkcnfhompoegfpgnkidcjfbojjp`; app registry
  `github.com/webisoftSoftware/1AM-app-registery`.
- dApp connector types: `@midnight-ntwrk/dapp-connector-api@4.0.1` `dist/api.d.ts` (`ConnectedAPI`,
  `KeyMaterialProvider`, `ProvingProvider`); midnight-js 4.0.2 `types` (`createProofProvider`, `WalletProvider`,
  `MidnightProvider`), `contracts`, `fetch-zk-config-provider`, `indexer-public-data-provider`.
- Browser precedents: `/home/erick/edda/album-gameplay/apps/web` (midnight-js 4.0.2 + ledger-v8 in Vite);
  `experiments/modular-starter/web/src/modules/midnight/wallet-widget/utils/customImplementations/in-memory-private-state-provider.ts`;
  `midnightntwrk/passport-demo` `BROWSER-PROVING-SCOPE.md` (WASM proving validation) and
  `examples/passport-docs/src/content.ts` (preprod cold-sync measurement, faucet and explorer URLs).
- Upstream VC core: `@midnight-ntwrk/credential-compact@0.1.0-rc3` (`src/credentials/status-bindings.compact`),
  `@midnight-ntwrk/credential-status@0.1.0-rc3`; family reference
  `github.com/midnightntwrk/midnight-verifiable-credential-digital-passport`
  (`docs/security/digital-passport-threat-model.md` §7).
- Ledger internals behind §4.2: `midnight-ledger` `ledger-wasm/Cargo.toml` (`default-features = false` on the
  ledger crate → contract-proof verification absent from the WASM), `ledger/src/verify.rs` (`public_inputs`),
  `proof-server/src/endpoints.rs` (no `/verify`), `ledger/src/dust.rs` (`INITIAL_DUST_PARAMETERS`).
- Compact ledger semantics: compact-core skill references (`MerkleTree` operations, disclosure rules); confirmed
  by compiling §7 with compactc 0.31.1 on 2026-09-03.
- Framework context: `docs/plans/components/RC17-identity-providers.md`, `RC7-compliance-hooks.md`,
  `RC1-trust-registry.md`; `docs/plans/PROMISES.md` RP11.
- Network probes (2026-09-03): preprod `system_version` 1.0.2; preview 1.0.1; stagenet 2.0.0; testnet-02 unreachable.
