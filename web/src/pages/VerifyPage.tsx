// Hiring platform: creates challenges, polls the registry through the indexer, never talks to the board.
import { useCallback, useEffect, useState } from "react";
import { encodeWire, randomBytes, todayDays, toHex, type PresentationRequestWire } from "@licensed/shared";
import { LICENSE_CATEGORIES } from "@licensed/contract";
import { useSession } from "@/app/session";
import { Copyable, ErrorBox, Field, Qr, short } from "@/components/ui";
import { readRegistry, snapshotRegistry, type RegistrySnapshot } from "@/midnight/registry";
import { boardStore, verifierStore, HANDOFF_CHANNEL, type HandoffMessage, type VerifierRequestRecord, type VerifierState } from "@/storage";
import { explorerTxUrl } from "@/settings";

const REQUEST_TTL_MS = 10 * 60_000;

export const VerifyPage = () => {
  const { publicData, settings } = useSession();
  const [state, setState] = useState<VerifierState | null>(null);
  const [registryAddress, setRegistryAddress] = useState("");
  const [verifierName, setVerifierName] = useState("Northwind Contracting — Hiring");
  const [category, setCategory] = useState(1);
  const [snapshot, setSnapshot] = useState<RegistrySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latestWire, setLatestWire] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const saved = await verifierStore.load();
      if (saved) {
        setState(saved);
        setRegistryAddress(saved.registryAddress);
        setVerifierName(saved.verifierName);
        return;
      }
      const board = await boardStore.load();
      if (board?.registryAddress) setRegistryAddress(board.registryAddress);
    })();
  }, []);

  const persist = useCallback(async (next: VerifierState) => {
    setState(next);
    await verifierStore.save(next);
  }, []);

  // Poll the registry: snapshot + verification records for our challenges.
  useEffect(() => {
    const address = state?.registryAddress ?? registryAddress;
    if (!address) return;
    let alive = true;
    const tick = async () => {
      try {
        const L = await readRegistry(publicData(), address);
        if (!alive) return;
        if (!L) {
          setError(`No registry found at ${short(address)} on ${settings.networkId}`);
          return;
        }
        setError(null);
        const snap = snapshotRegistry(L);
        setSnapshot(snap);
        if (state) {
          let changed = false;
          const requests = state.requests.map((r) => {
            if (r.status !== "waiting") return r;
            if (L.verifications.member(r.challenge)) {
              changed = true;
              return { ...r, status: "verified" as const };
            }
            if (Date.now() - r.createdAt > REQUEST_TTL_MS) {
              changed = true;
              return { ...r, status: "expired" as const };
            }
            return r;
          });
          if (changed) await persist({ ...state, requests });
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      }
    };
    void tick();
    const id = setInterval(tick, 4_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [state, registryAddress, publicData, settings.networkId, persist]);

  const requestProof = async () => {
    if (!registryAddress) {
      setError("Enter the board's registry address first");
      return;
    }
    const challenge = randomBytes(32);
    const currentDay = todayDays();
    const wire: PresentationRequestWire = { version: 1, registryAddress, challenge, requiredCategory: category, currentDay, verifierName };
    const encoded = encodeWire(wire);
    const record: VerifierRequestRecord = { id: toHex(challenge).slice(0, 12), challenge, requiredCategory: category, currentDay, registryAddress, createdAt: Date.now(), status: "waiting" };
    const next: VerifierState = { registryAddress, verifierName, requests: [record, ...(state?.requests ?? [])].slice(0, 20) };
    await persist(next);
    setLatestWire(encoded);
    try {
      new BroadcastChannel(HANDOFF_CHANNEL).postMessage({ type: "request", wire: encoded } satisfies HandoffMessage);
    } catch {
      /* no BroadcastChannel */
    }
  };

  const requests = state?.requests ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="card space-y-3 lg:col-span-2">
        <h1 className="text-xl font-bold">Hiring platform</h1>
        <p className="text-sm text-slate-700">
          Ask a practitioner to prove they hold an <b>active</b> licence in a category. You will learn only that fact, from
          the chain, keyed by a challenge only you know. No name, no licence number, no call to the board.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Board registry address">
            <input className="input mono" value={registryAddress} onChange={(e) => setRegistryAddress(e.target.value.trim())} placeholder="registry contract address" data-testid="verify-registry" />
          </Field>
          <Field label="Your name (shown to the practitioner)">
            <input className="input" value={verifierName} onChange={(e) => setVerifierName(e.target.value)} />
          </Field>
          <Field label="Required licence category">
            <select className="input" value={category} onChange={(e) => setCategory(Number(e.target.value))} data-testid="verify-category">
              {Object.entries(LICENSE_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
        </div>
        <button className="btn" onClick={() => void requestProof()} data-testid="request-proof">Request proof</button>
        <ErrorBox error={error} />
        {latestWire && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="label mb-1">Latest request — hand this to the practitioner</div>
            <div className="flex gap-3">
              <div className="flex-1"><Copyable value={latestWire} testId="request-wire" /></div>
              <Qr value={latestWire} size={140} />
            </div>
          </div>
        )}
        <h2 className="pt-2 font-semibold">Requests</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr><th>Challenge</th><th>Category</th><th>As of</th><th>Status</th></tr>
          </thead>
          <tbody>
            {requests.length === 0 && <tr><td colSpan={4} className="py-2 text-slate-500">No requests yet.</td></tr>}
            {requests.map((r) => (
              <tr key={r.id} className="border-t border-slate-100" data-testid={`request-${r.id}`} data-status={r.status}>
                <td className="mono py-1">{short(toHex(r.challenge), 8)}</td>
                <td>{LICENSE_CATEGORIES[r.requiredCategory] ?? r.requiredCategory}</td>
                <td>day {r.currentDay}</td>
                <td>
                  {r.status === "verified" && <span className="chip chip-active">Verified — active {LICENSE_CATEGORIES[r.requiredCategory]?.toLowerCase()} licence</span>}
                  {r.status === "waiting" && <span className="chip chip-waiting">Waiting for proof…</span>}
                  {r.status === "expired" && <span className="chip chip-revoked">Not verified (no valid proof within 10 min)</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <aside className="card space-y-2 text-sm">
        <h2 className="font-semibold">What the chain shows</h2>
        {!snapshot && <p className="text-slate-500">Enter a registry address to watch it.</p>}
        {snapshot && (
          <dl className="space-y-1" data-testid="registry-panel">
            <dt className="label">Active-licence root</dt>
            <dd className="mono" data-testid="registry-root">{short(snapshot.root, 12)}</dd>
            <dt className="label">Issued / revoked</dt>
            <dd data-testid="registry-counts">{snapshot.issuedCount.toString()} / {snapshot.revokedCount.toString()}</dd>
            <dt className="label">Issuer DID contract</dt>
            <dd className="mono">{short(snapshot.issuerDidContract)}</dd>
            <dt className="label">Verification records ({snapshot.verifications.length})</dt>
            <dd className="space-y-1">
              {snapshot.verifications.slice(-5).map((v) => (
                <div key={toHex(v.challenge)} className="mono text-xs">
                  {short(toHex(v.challenge), 6)} → category {v.category.toString()}, day {v.currentDay.toString()}
                  {explorerTxUrl(settings.networkId, "") ? "" : ""}
                </div>
              ))}
            </dd>
          </dl>
        )}
        <p className="pt-2 text-xs text-slate-500">
          A record is a true statement about the day it was proven under the root at that time. Only a fresh challenge reflects
          current status — which is exactly why revocation is observable.
        </p>
      </aside>
    </div>
  );
};
