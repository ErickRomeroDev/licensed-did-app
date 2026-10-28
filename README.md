# Licensed — private, revocable professional licences on `did:midnight`

**Live demo:** [licensed.eddalabs.io](https://licensed.eddalabs.io/) — see [Run against preview with the 1AM wallet](#run-against-preview-with-the-1am-wallet) for what you need to try it.

A browser-only demonstration built on the [Midnight DID reference implementation](https://github.com/midnightntwrk/midnight-did):

- a **licensing board** creates its own `did:midnight` identity and a licence registry from its browser and issues a
  professional-licence credential to a practitioner,
- the **practitioner** holds the credential privately in their browser,
- a **hiring platform** learns exactly one thing — *this person holds an active licence in the category I asked for,
  issued by this board* — from a zero-knowledge proof, without receiving the credential, the name or the licence number,
- the board **revokes**, and the hiring platform sees the change **without ever contacting the board**.

Nothing of ours runs outside the browser. The deployed artefact is a folder of static files. The only external
pieces are public Midnight infrastructure (the indexer), the user's **1AM wallet extension** (balancing, fees,
submission, proving) and, as a fallback, a proof server the user runs locally.

The full design is in [`spec.md`](./spec.md). This README covers setup, architecture, trust, and how to adapt it.

---

## How it works in one paragraph

The board's registry contract (`LicenseRegistry`, Compact) keeps a **Merkle tree of status-handle commitments**, one leaf
per issued licence, plus a map of verification outcomes keyed by verifier challenge. Issuing inserts a leaf; revoking
overwrites that leaf with a tombstone, so only the *current* root validates. A credential is a signed envelope over a
commitment to the claims (name, licence number, category, dates) bound to the practitioner's Jubjub key and to that
leaf. To present, the practitioner submits a transaction whose circuit, over **private inputs**, verifies the board's
Jubjub Schnorr signature (the reference implementation's own module), opens the claims commitment, checks the requested
predicate (`category == X && expiresAtDay > today`), proves Merkle membership of the leaf under the current root, verifies
the practitioner signed the verifier's challenge, and records `{category, day}` under the challenge. The verifier polls
that one map entry through the indexer. After revocation, no valid proof exists and the entry never appears.

## Repository layout

```
contract/   @licensed/contract  LicenseRegistry.compact (+ vendored Schnorr module), witnesses, simulator tests
shared/     @licensed/shared    credential build/sign/verify (via the contract's pure circuits), offchain DID helpers, codecs
web/        @licensed/web       Vite + React static app: /board · /wallet · /verify, 1AM connector, DID port, dev wallet shim
deploy/     @licensed/deploy    integration tests against a local standalone chain (reference implementation's headless wallet)
infra/      standalone.yml      docker: Midnight node + indexer + proof server for tests only — never deployed
scripts/    fetch-did-artifacts.mjs  downloads + sha256-verifies the did:midnight ZK artifacts (0.5.0 release)
spec.md     the specification (concepts, architecture, contract, flows, privacy, deployment, spikes)
```

## Stack

| Piece | Version |
|---|---|
| Compact compiler | **0.31.1** (the version pinned by midnight-did) — `compact compile +0.31.1` |
| `@midnight-ntwrk/midnight-did-{contract,did,domain,jubjub-schnorr}` | 0.5.0 (published; browser-safe) |
| `@midnight-ntwrk/midnight-js-*` | 4.0.2 · `ledger-v8` 8.1.0 · `compact-runtime` 0.16.0 · `compact-js` 2.5.0 |
| `@midnight-ntwrk/dapp-connector-api` | 4.0.1 (1AM implements connector v4) |
| Node / pnpm | 24 / 10 |

## Clean-clone build

```bash
nvm use 24 && corepack enable
compact update 0.31.1              # installs the pinned compiler (does not need to be the default)
pnpm install
pnpm -r compact                    # compiles the LicenseRegistry contract with full ZK keys (~10 s)
pnpm -r build                      # builds contract, shared, web (downloads + verifies the did:midnight ZK artifacts)
pnpm test                          # simulator + shared unit tests, no network
```

The GitHub Actions workflow in `.github/workflows/ci.yml` runs exactly these steps.

## Run the demo locally (no wallet extension needed)

The web app ships a **dev-only connector shim**: an in-page headless wallet on a local standalone chain that exposes the
same dApp-connector v4 surface as the 1AM extension. It is loaded only when `VITE_DEV_WALLET=true` and is never part
of a production build.

```bash
pnpm standalone:up                 # docker: node 0.22.2 + indexer-standalone 4.0.1 + proof-server 8.0.3 (ports 9944/8088/6300)
pnpm --filter @licensed/web zk-assets
pnpm --filter @licensed/web dev:standalone     # http://localhost:5175 with the dev wallet installed
```

Then follow the storyline: **Start** → connect *Dev Standalone Wallet* (first connect syncs the tiny chain and registers
NIGHT for DUST, ~1 min) → **Board** → *Create board* (4 transactions) → **Practitioner** → *Create my identity* →
copy the DID → **Board** → issue → copy the bundle → **Practitioner** → *Add licence* (shows **Active**) →
**Hiring platform** → *Request proof* → copy → **Practitioner** → *Read request* → *Prove* → **Hiring platform** shows
**Verified** → **Board** → *Revoke* → **Practitioner** shows **Revoked** → **Hiring platform** → new request →
**Practitioner** → *Prove* fails with "License is revoked or unknown" → the platform's request stays unanswered.

Automated versions of the same run:

```bash
pnpm test:integration              # deploy/: the whole lifecycle in Node against the standalone stack (~3.5 min)
pnpm e2e                           # web/: the storyline in headless Chromium via Playwright (~2.5 min), screenshots in web/e2e/artifacts/
```

## Run against preview with the 1AM wallet

1. Install the [1AM wallet](https://1am.xyz) extension, create a wallet, switch it to **preview**.
2. Get test NIGHT from `https://faucet.preview.midnight.network` (captcha). Wait until the wallet shows a **DUST**
   balance — DUST is the fee resource NIGHT generates after registration; first fees arrive within minutes.
3. Serve `web/dist` from any static host (or `pnpm --filter @licensed/web preview`), open it, keep **Network = preview**
   in Settings, connect the wallet, and run the storyline above. One wallet can play every role on one machine;
   three browsers can exchange the DID, bundle and request strings by copy/paste or QR.

The app targets **preview** (indexer `https://indexer.preview.midnight.network/api/v4/graphql`; node and prover come
from the wallet's configuration). Preprod is no longer offered: its endpoints now need a Blockfrost project id, which a
static app cannot keep secret. Settings saved on preprod are moved to preview on load.

Proving goes through the wallet's proving provider (`getProvingProvider`; 1AM routes to its ProofStation). If a wallet
version does not expose one, set a **local proof server URL** in Settings (`http://localhost:6300`, docker
`midnightntwrk/proof-server` matching the network's ledger line).

> Status (2026-09-03): the preprod/1AM run has not been exercised yet (no funded 1AM wallet at build time). The same
> code path — connector adapter, wallet-delegated proving, DID port, registry — runs end-to-end on the standalone chain
> through the dev shim, both in Node (`pnpm test:integration`, 5/5) and in Chromium (`pnpm e2e`, 13 screenshots).

## Architecture and trust

```
 browser (static SPA)             1AM wallet (extension)              preview
 /board  board secrets ──────────► balance · sign · submit ──────────► Board DID contract (did:midnight)
 /wallet holder key, credential ─► getProvingProvider (proving) ─────► LicenseRegistry contract
 /verify challenges  ◄──────────── read-only indexer GraphQL ◄──────── public state
```

| Component | Holds | Trust |
|---|---|---|
| Board tab | DID controller/recovery secrets, registry issuer key, licence ledger (IndexedDB; **export it**) | The board's back office is the operator's browser. Losing the profile without an export loses issue/revoke. |
| Practitioner tab | Jubjub key, offchain `did:midnight`, credential bundle | Nothing leaves the browser except the public key (issuance) and the proof (presentation). |
| Wallet | NIGHT/DUST keys, proving backend | Balances, pays, signs, submits. **Its proving backend sees the private inputs of every proof.** Fee inputs link presentations to the payer's wallet on-chain (see spec §10). |
| Verifier tab | Challenges | Reads the indexer only. Never contacts the board. |

Why no cross-contract call: the 4.x stack has no contract-to-contract calls, so the registry seals the issuer's Jubjub key
and DID contract address at deployment, and the board/verifier screens resolve the DID in-browser with the reference
resolver to show that `#key-assert` equals the sealed key.

## Adapting to another credential

1. **Claims and predicate.** Edit `LicenseClaims` and the predicate block in `contract/src/license-registry.compact`
   (`present`, step 4). Everything else — commitment, signature, status tree, challenge record — is generic.
2. **Schema id and domain tags.** Change `edda:vc:professional-license:v1` and the digest tags in the contract and
   `contract/src/constants.ts`.
3. **Recompile and re-run the simulator tests** (`pnpm -r compact && pnpm test`); the tests describe the properties any
   family must keep (revocation invalidates, replay rejected, forged signatures rejected).
4. **UI.** The three pages only know about `LICENSE_CATEGORIES` and the claim form fields.

## Known issues and notes

- **indexer-standalone 4.0.x cannot follow node 1.0.x** (`unsupported protocol version 1000000`). The local test stack
  therefore runs node 0.22.2, the line midnight-did's own compose file uses. Preprod runs node 1.0.2 with Midnight's
  hosted indexer; connector-based clients on the 4.0.2 line are expected to work there, to be confirmed by the preprod run.
- **Single-variant Compact enums break proving** on compactc 0.31.1 + compact-runtime 0.16.0: the compiler allocates
  one circuit input, the runtime encodes zero, and the proof server answers `BadInput("Expected 61 inputs, received 60")`.
  `StatusType` therefore has two variants (`none`, `revocationRegistry`). Upstream `credential-compact` declares the
  single-variant form but only in pure circuits, so it never hits the prover. To be filed upstream.
- The midnight-did **API package is Node-only**; the browser port of its orchestration lives in `web/src/midnight/did/`
  and consumes the published contract/resolver/domain/signer packages directly.
- Off-chain verification of a proof is not possible with the shipped ledger WASM; presentation is an on-chain transaction
  by design (spec §4.2).
- Reading a licence's status must use `findPathForLeaf(commitment)`; `pathForLeaf(index, leaf)` builds a path for
  whatever leaf it is given and only the circuit's `checkRoot` rejects a stale one.
- Vite dev server: `object-inspect` (via compact-runtime) requires Node's `util.inspect` at load time unless the
  package is pre-bundled by esbuild (see `optimizeDeps.include`), and the excluded WASM package
  `@midnight-ntwrk/onchain-runtime-v3` must be a direct dependency so its bare import resolves.
- The Vite build reports Rollup warnings about `isomorphic-ws` and Node-only `Simulator.js` files inside the wallet SDK;
  they are dead paths in the browser.

## Author

Built by **Erick Romero** — [@ErickRomeroEdda](https://x.com/ErickRomeroEdda) on X. Questions, bug reports and feedback welcome.

## License

Apache-2.0. See `LICENSE` and `NOTICE` (vendored Schnorr module from midnight-did).
