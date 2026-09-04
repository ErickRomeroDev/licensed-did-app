// Practitioner: offchain DID identity, held licences with live status, and zero-knowledge presentation.
import { useCallback, useEffect, useState } from "react";
import { LICENSE_CATEGORIES, unpadBytes } from "@licensed/contract";
import {
  daysToIsoDate,
  decodeWire,
  holderDidFromKey,
  publicKeyOf,
  randomScalar,
  toHex,
  type HeldLicense,
  type HolderIdentity,
  type LicenseBundleWire,
  type PresentationRequestWire,
} from "@licensed/shared";
import { useSession } from "@/app/session";
import { Copyable, ErrorBox, Field, Qr, short, Steps } from "@/components/ui";
import { joinRegistry, licenseStatus, presentLicense, readRegistry, type LicenseStatus, type RegistryCircuit } from "@/midnight/registry";
import type { RegistryPrivateState } from "@licensed/contract";
import { explorerTxUrl } from "@/settings";
import { holderStore, HANDOFF_CHANNEL, type HandoffMessage } from "@/storage";

type StepState = "todo" | "running" | "done" | "error";

export const WalletPage = () => {
  const { publicData, session, connect, providersFor, settings } = useSession();
  const [identity, setIdentity] = useState<HolderIdentity | null>(null);
  const [licenses, setLicenses] = useState<HeldLicense[]>([]);
  const [statuses, setStatuses] = useState<Record<string, LicenseStatus>>({});
  const [incoming, setIncoming] = useState("");
  const [requestText, setRequestText] = useState("");
  const [request, setRequest] = useState<PresentationRequestWire | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proveSteps, setProveSteps] = useState<Array<{ label: string; state: StepState; detail?: string }> | null>(null);
  const [proveResult, setProveResult] = useState<{ txHash: string } | null>(null);

  useEffect(() => {
    void (async () => {
      setIdentity(await holderStore.loadIdentity());
      setLicenses(await holderStore.loadLicenses());
    })();
  }, []);

  // Same-browser handoff from the board / verifier tabs.
  useEffect(() => {
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(HANDOFF_CHANNEL);
      ch.onmessage = (ev: MessageEvent<HandoffMessage>) => {
        if (ev.data?.type === "license") setIncoming(ev.data.wire);
        if (ev.data?.type === "request") setRequestText(ev.data.wire);
      };
    } catch {
      /* unsupported */
    }
    return () => ch?.close();
  }, []);

  const refreshLicenses = useCallback(async () => {
    const list = await holderStore.loadLicenses();
    setLicenses(list);
  }, []);

  // Live status from the public tree (no wallet, no issuer contact).
  useEffect(() => {
    if (licenses.length === 0) return;
    let alive = true;
    const tick = async () => {
      const next: Record<string, LicenseStatus> = {};
      for (const lic of licenses) {
        try {
          const L = await readRegistry(publicData(), lic.registryAddress);
          next[key(lic)] = L ? licenseStatus(L, lic.leafIndex, lic.credential.statusBinding.statusHandleCommitment) : "unknown";
        } catch {
          next[key(lic)] = "unknown";
        }
      }
      if (alive) setStatuses(next);
    };
    void tick();
    const id = setInterval(tick, 5_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [licenses, publicData]);

  const createIdentity = async () => {
    const secretScalar = randomScalar();
    const publicKey = publicKeyOf(secretScalar);
    const id: HolderIdentity = { secretScalar, publicKey, did: holderDidFromKey(publicKey) };
    await holderStore.saveIdentity(id);
    setIdentity(id);
  };

  const receiveLicense = async () => {
    setError(null);
    try {
      const bundle = decodeWire<LicenseBundleWire>(incoming);
      if (bundle.version !== 1 || !bundle.license?.credential) throw new Error("Not a licence bundle");
      if (identity && toHex(bundleKeyX(bundle.license)) !== identity.publicKey.x.toString(16).padStart(64, "0")) {
        throw new Error("This licence was issued to a different practitioner key");
      }
      const list = [...(await holderStore.loadLicenses()).filter((l) => key(l) !== key(bundle.license)), bundle.license];
      await holderStore.saveLicenses(list);
      setLicenses(list);
      setIncoming("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const parseRequest = () => {
    setError(null);
    setProveResult(null);
    setProveSteps(null);
    try {
      const r = decodeWire<PresentationRequestWire>(requestText);
      if (r.version !== 1 || !r.challenge || !r.registryAddress) throw new Error("Not a proof request");
      setRequest(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const prove = async () => {
    if (!request || !identity) return;
    const lic = licenses.find((l) => l.registryAddress.toLowerCase() === request.registryAddress.toLowerCase());
    if (!lic) {
      setError("You hold no licence from the registry this platform trusts.");
      return;
    }
    const steps: Array<{ label: string; state: StepState; detail?: string }> = [
      { label: "Connect wallet", state: "todo" },
      { label: "Read the current registry root and build the membership path", state: "todo" },
      { label: "Prove (wallet proving provider), balance and submit", state: "todo" },
    ];
    const set = (i: number, state: StepState, detail?: string) => {
      steps[i] = { ...steps[i]!, state, detail };
      setProveSteps([...steps]);
    };
    setError(null);
    setProveResult(null);
    setProveSteps([...steps]);
    try {
      set(0, "running");
      const s = session ?? (await connect());
      set(0, "done", `${s.walletName} on ${s.networkId}`);
      set(1, "running");
      const { providers, provingMode } = await providersFor<RegistryCircuit, "licensedRegistry", RegistryPrivateState>("license-registry");
      const L = await readRegistry(providers.publicDataProvider, lic.registryAddress);
      if (!L) throw new Error("Registry not found");
      const status = licenseStatus(L, lic.leafIndex, lic.credential.statusBinding.statusHandleCommitment);
      if (status !== "active") throw new Error("License is revoked or unknown — no valid proof can be built");
      const handle = await joinRegistry(providers, lic.registryAddress, {});
      set(1, "done", `root ${short(L.activeLicenses.root().field.toString(16), 8)}`);
      set(2, "running", provingMode.kind === "wallet" ? "proving through the wallet" : `proving via ${provingMode.url}`);
      const txHash = await presentLicense({
        handle,
        ledger: L,
        credential: lic.credential,
        issuerSignature: lic.issuerSignature,
        claims: lic.claims,
        claimsOpening: lic.claimsOpening,
        leafIndex: lic.leafIndex,
        holderSecretScalar: identity.secretScalar,
        request: { challenge: request.challenge, requiredCategory: BigInt(request.requiredCategory), currentDay: BigInt(request.currentDay) },
      });
      set(2, "done", txHash);
      setProveResult({ txHash });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const idx = steps.findIndex((x) => x.state === "running");
      if (idx >= 0) set(idx, "error", msg);
      setError(msg);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card space-y-3">
        <h1 className="text-xl font-bold">Practitioner</h1>
        {!identity ? (
          <>
            <p className="text-sm text-slate-700">Create a Jubjub key pair in this browser. Your identity is an offchain <code>did:midnight</code> — free, instant, no wallet needed yet.</p>
            <button className="btn" onClick={() => void createIdentity()} data-testid="create-identity">Create my identity</button>
          </>
        ) : (
          <>
            <div className="label">Your DID (share with the board)</div>
            <div className="flex gap-3">
              <div className="flex-1"><Copyable value={identity.did} testId="holder-did" /></div>
              <Qr value={identity.did} size={120} />
            </div>
          </>
        )}
        <h2 className="pt-2 font-semibold">Your licences</h2>
        {licenses.length === 0 && <p className="text-sm text-slate-500">None yet. Paste the bundle the board gives you below.</p>}
        {licenses.map((lic) => {
          const st = statuses[key(lic)] ?? "unknown";
          return (
            <div key={key(lic)} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm" data-testid="license-card" data-status={st}>
              <div className="flex items-center justify-between">
                <div className="font-semibold">{LICENSE_CATEGORIES[Number(lic.claims.category)] ?? `Category ${lic.claims.category}`} licence</div>
                <span className={`chip ${st === "active" ? "chip-active" : st === "revoked" ? "chip-revoked" : "chip-neutral"}`} data-testid="license-status">
                  {st === "active" ? "Active" : st === "revoked" ? "Revoked" : "Checking…"}
                </span>
              </div>
              <div className="text-slate-600">Issued by {lic.boardName} · expires {daysToIsoDate(lic.claims.expiresAtDay)}</div>
              <div className="mono text-xs text-slate-500">{unpadBytes(lic.claims.licenseNumber)} · {unpadBytes(lic.claims.holderName)} — private, never sent to a verifier</div>
              <div className="mono text-xs text-slate-400">issuer {short(lic.issuerDid, 14)}</div>
            </div>
          );
        })}
        <Field label="Receive a licence bundle">
          <textarea className="input mono h-20" value={incoming} onChange={(e) => setIncoming(e.target.value)} placeholder="paste the bundle from the board" data-testid="incoming-license" />
        </Field>
        <button className="btn-secondary" onClick={() => void receiveLicense()} disabled={!incoming} data-testid="receive-license">Add licence</button>
        <button className="btn-secondary" onClick={() => void refreshLicenses()}>Refresh</button>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Prove to a hiring platform</h2>
        <Field label="Proof request">
          <textarea className="input mono h-20" value={requestText} onChange={(e) => setRequestText(e.target.value)} placeholder="paste the request from the platform" data-testid="request-input" />
        </Field>
        <button className="btn-secondary" onClick={parseRequest} disabled={!requestText} data-testid="parse-request">Read request</button>
        {request && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm" data-testid="request-summary">
            <p>
              <b>{request.verifierName}</b> asks you to prove: <i>active {LICENSE_CATEGORIES[request.requiredCategory]?.toLowerCase() ?? `category ${request.requiredCategory}`} licence</i> from the board
              at <span className="mono">{short(request.registryAddress)}</span>, as of {daysToIsoDate(request.currentDay)}.
            </p>
            <p className="mt-1 text-xs text-slate-600">They will learn only that fact. Your name and licence number stay in this browser. Your wallet pays the transaction fee.</p>
            <button className="btn mt-2" onClick={() => void prove()} disabled={!identity || proveSteps?.some((s) => s.state === "running")} data-testid="prove">
              Prove
            </button>
          </div>
        )}
        {proveSteps && <Steps steps={proveSteps} />}
        {proveResult && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm" data-testid="prove-success">
            Proof accepted on-chain. <span className="mono">{short(proveResult.txHash, 10)}</span>
            {explorerTxUrl(settings.networkId, proveResult.txHash) && (
              <a className="ml-2 underline" href={explorerTxUrl(settings.networkId, proveResult.txHash)!} target="_blank" rel="noreferrer">explorer</a>
            )}
          </div>
        )}
        <ErrorBox error={error} />
      </section>
    </div>
  );
};

const key = (l: HeldLicense): string => `${l.registryAddress}:${l.leafIndex.toString()}`;
const bundleKeyX = (l: HeldLicense): Uint8Array => {
  const x = l.credential.holderBinding.holderPublicKey.x.toString(16).padStart(64, "0");
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = parseInt(x.slice(i * 2, i * 2 + 2), 16);
  return out;
};
