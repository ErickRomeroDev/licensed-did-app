// Licensing board: create/join a board (DID + registry from the browser), issue and revoke licences, export/import.
import { useCallback, useEffect, useState } from "react";
import type { DIDPrivateState } from "@midnight-ntwrk/midnight-did-contract";
import type { MidnightDIDDocument } from "@midnight-ntwrk/midnight-did";
import { LICENSE_CATEGORIES, type RegistryPrivateState } from "@licensed/contract";
import {
  buildCredential,
  claimsFromInput,
  commitClaims,
  daysToIsoDate,
  encodeJson,
  encodeWire,
  isoDateToDays,
  newStatusHandle,
  publicKeyOf,
  randomBytes,
  randomScalar,
  resolveHolderDid,
  signCredential,
  todayDays,
  type BoardLicenseRecord,
  type BoardState,
  type HeldLicense,
  type LicenseBundleWire,
} from "@licensed/shared";
import { useSession } from "@/app/session";
import { Copyable, ErrorBox, Field, short, Steps } from "@/components/ui";
import { addAssertKey, addAssertionRelation, createDid, didStringFor, joinDid, resolveDid, type DidProviders } from "@/midnight/did";
import { deployRegistry, issueLicense, joinRegistry, readRegistry, revokeLicense, type RegistryCircuit } from "@/midnight/registry";
import { explorerTxUrl } from "@/settings";
import { boardStore, holderStore, HANDOFF_CHANNEL, type HandoffMessage } from "@/storage";

type StepState = "todo" | "running" | "done" | "error";
type Step = { label: string; state: StepState; detail?: string };

const download = (name: string, text: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};

export const BoardPage = () => {
  const { session, connect, providersFor, publicData, settings, updateSettings } = useSession();
  const [board, setBoard] = useState<BoardState | null | undefined>(undefined);
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [didDoc, setDidDoc] = useState<MidnightDIDDocument | null>(null);
  const [importText, setImportText] = useState("");
  const [lastBundle, setLastBundle] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({
    holderDid: "",
    holderName: "Ada Lovelace",
    licenseNumber: `CA-${Math.floor(1000 + Math.random() * 9000)}`,
    category: 1,
    jurisdiction: "CA",
    issuedAt: daysToIsoDate(todayDays() - 30),
    expiresAt: daysToIsoDate(todayDays() + 730),
  });

  useEffect(() => {
    void boardStore.load().then((b) => setBoard(b));
  }, []);

  const persist = useCallback(async (b: BoardState) => {
    setBoard(b);
    await boardStore.save(b);
  }, []);

  const didString = board ? didStringFor(board.didContractAddress, board.network) : null;

  const createBoard = async () => {
    setError(null);
    const s: Step[] = [
      { label: "Connect wallet", state: "todo" },
      { label: "Deploy the board's did:midnight contract", state: "todo" },
      { label: "Publish the signing key as #key-assert", state: "todo" },
      { label: "Mark #key-assert as assertionMethod", state: "todo" },
      { label: "Deploy the LicenseRegistry", state: "todo" },
    ];
    const set = (i: number, state: StepState, detail?: string) => {
      s[i] = { ...s[i]!, state, detail };
      setSteps([...s]);
    };
    setSteps([...s]);
    try {
      set(0, "running");
      const sess = session ?? (await connect());
      set(0, "done", `${sess.walletName} on ${sess.networkId}`);

      const didPrivate: DIDPrivateState = { secretKey: randomBytes(32), recoverySecretKey: randomBytes(32) };
      const issuerSecretScalar = randomScalar();
      const { providers: didProviders } = await providersFor<string, "midnightDIDPrivateState", DIDPrivateState>("did");

      set(1, "running", "proving + submitting (first run downloads prover keys)");
      const { handle, address } = await createDid(didProviders as DidProviders, didPrivate);
      set(1, "done", didStringFor(address, sess.networkId));

      set(2, "running");
      const tx2 = await addAssertKey({
        handle,
        providers: didProviders as DidProviders,
        address,
        networkId: sess.networkId,
        controllerSecret: didPrivate.secretKey!,
        publicKey: publicKeyOf(issuerSecretScalar),
      });
      set(2, "done", tx2);

      set(3, "running");
      const tx3 = await addAssertionRelation({ handle, providers: didProviders as DidProviders, address, networkId: sess.networkId, controllerSecret: didPrivate.secretKey! });
      set(3, "done", tx3);

      set(4, "running");
      const { providers: regProviders } = await providersFor<RegistryCircuit, "licensedRegistry", RegistryPrivateState>("license-registry");
      const reg = await deployRegistry(regProviders, issuerSecretScalar, address);
      set(4, "done", reg.address);

      await persist({
        version: 1,
        network: sess.networkId,
        boardName: settings.boardName,
        didContractAddress: address,
        didControllerSecret: didPrivate.secretKey!,
        didRecoverySecret: didPrivate.recoverySecretKey!,
        issuerSecretScalar,
        registryAddress: reg.address,
        licenses: [],
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const idx = s.findIndex((x) => x.state === "running");
      if (idx >= 0) set(idx, "error", msg);
      setError(msg);
    }
  };

  const importBoard = async () => {
    setError(null);
    try {
      const parsed = JSON.parse(importText) as unknown;
      const b = (await import("@licensed/shared")).decodeJson<BoardState>(typeof parsed === "string" ? parsed : importText);
      if (b.version !== 1 || !b.registryAddress || !b.didContractAddress) throw new Error("Not a board export");
      await persist(b);
      if (b.network !== settings.networkId) updateSettings({ networkId: b.network });
      setImportText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const resolveBoardDid = async () => {
    if (!board || !didString) return;
    setError(null);
    try {
      setDidDoc(await resolveDid(publicData(), didString, board.network));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const issue = async () => {
    if (!board) return;
    setError(null);
    setLastBundle(null);
    setBusy("Issuing… (the wallet will ask you to approve one transaction)");
    try {
      const sess = session ?? (await connect());
      const holder = resolveHolderDid(form.holderDid);
      const { providers } = await providersFor<RegistryCircuit, "licensedRegistry", RegistryPrivateState>("license-registry");
      const handle = await joinRegistry(providers, board.registryAddress, { issuerSecretScalar: board.issuerSecretScalar });
      const before = await readRegistry(providers.publicDataProvider, board.registryAddress);
      if (!before) throw new Error("Registry not found on chain");
      const leafIndex = before.issuedCount;

      const claims = claimsFromInput({
        category: form.category,
        jurisdiction: form.jurisdiction,
        licenseNumber: form.licenseNumber,
        holderName: form.holderName,
        issuedAtDay: isoDateToDays(form.issuedAt),
        expiresAtDay: isoDateToDays(form.expiresAt),
      });
      const claimsOpening = randomBytes(32);
      const handleCommit = newStatusHandle();
      const txHash = await issueLicense(handle, handleCommit.commitment);
      const after = await readRegistry(providers.publicDataProvider, board.registryAddress);
      if (!after) throw new Error("Registry not found after issue");

      const credential = buildCredential({
        didContractAddress: board.didContractAddress,
        registryId: after.registryId,
        holderPublicKey: holder.publicKey,
        claimsCommitment: commitClaims(claims, claimsOpening),
        statusHandleCommitment: handleCommit.commitment,
      });
      const issuerSignature = signCredential(board.issuerSecretScalar, credential);
      const held: HeldLicense = {
        credential,
        claims,
        claimsOpening,
        issuerSignature,
        leafIndex,
        registryAddress: board.registryAddress,
        issuerDid: didStringFor(board.didContractAddress, sess.networkId),
        boardName: board.boardName,
        receivedAt: Date.now(),
      };
      const record: BoardLicenseRecord = {
        licenseNumber: form.licenseNumber,
        holderName: form.holderName,
        holderDid: holder.did,
        category: form.category,
        jurisdiction: form.jurisdiction,
        issuedAtDay: isoDateToDays(form.issuedAt),
        expiresAtDay: isoDateToDays(form.expiresAt),
        leafIndex,
        statusHandleCommitment: handleCommit.commitment,
        revoked: false,
        issuedTxHash: txHash,
      };
      await persist({ ...board, licenses: [...board.licenses, record] });
      const wire = encodeWire({ version: 1, license: held } satisfies LicenseBundleWire);
      setLastBundle(wire);
      try {
        new BroadcastChannel(HANDOFF_CHANNEL).postMessage({ type: "license", wire } satisfies HandoffMessage);
      } catch {
        /* ignore */
      }
      setForm((f) => ({ ...f, licenseNumber: `CA-${Math.floor(1000 + Math.random() * 9000)}` }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const deliverLocally = async () => {
    if (!lastBundle) return;
    const { decodeWire } = await import("@licensed/shared");
    const bundle = decodeWire<LicenseBundleWire>(lastBundle);
    const list = (await holderStore.loadLicenses()).filter((l) => !(l.registryAddress === bundle.license.registryAddress && l.leafIndex === bundle.license.leafIndex));
    await holderStore.saveLicenses([...list, bundle.license]);
    setBusy("Delivered to the practitioner wallet in this browser.");
    setTimeout(() => setBusy(null), 2000);
  };

  const revoke = async (rec: BoardLicenseRecord) => {
    if (!board) return;
    setError(null);
    setBusy(`Revoking ${rec.licenseNumber}… (approve the transaction in your wallet)`);
    try {
      await (session ?? connect());
      const { providers } = await providersFor<RegistryCircuit, "licensedRegistry", RegistryPrivateState>("license-registry");
      const handle = await joinRegistry(providers, board.registryAddress, { issuerSecretScalar: board.issuerSecretScalar });
      const txHash = await revokeLicense(handle, rec.leafIndex);
      await persist({
        ...board,
        licenses: board.licenses.map((l) => (l.leafIndex === rec.leafIndex ? { ...l, revoked: true, revokedTxHash: txHash } : l)),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  if (board === undefined) return <p className="text-sm text-slate-500">Loading…</p>;

  if (!board) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card space-y-3">
          <h1 className="text-xl font-bold">Create a licensing board</h1>
          <p className="text-sm text-slate-700">
            Four transactions from your wallet: deploy the board's <code>did:midnight</code> contract, publish its signing key as{" "}
            <code>#key-assert</code>, mark it <code>assertionMethod</code>, and deploy the licence registry sealed to that key.
          </p>
          <Field label="Board name">
            <input className="input" value={settings.boardName} onChange={(e) => updateSettings({ boardName: e.target.value })} data-testid="board-name" />
          </Field>
          <button className="btn" onClick={() => void createBoard()} disabled={steps?.some((s) => s.state === "running")} data-testid="create-board">
            Create board
          </button>
          {steps && <Steps steps={steps} />}
          <ErrorBox error={error} />
        </section>
        <section className="card space-y-3">
          <h2 className="font-semibold">Import an existing board</h2>
          <p className="text-sm text-slate-700">Paste a board export (JSON). It contains the board's secrets — treat it like a key file.</p>
          <textarea className="input mono h-32" value={importText} onChange={(e) => setImportText(e.target.value)} data-testid="import-board" />
          <button className="btn-secondary" onClick={() => void importBoard()} disabled={!importText}>Import</button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="card space-y-2" data-testid="board-header">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold">{board.boardName}</h1>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => download(`licensed-board-${short(board.registryAddress, 4)}.json`, encodeJson(board, true))}>Export board</button>
            <button className="btn-secondary" onClick={() => void resolveBoardDid()} data-testid="resolve-did">Resolve DID</button>
          </div>
        </div>
        <div className="grid gap-2 text-sm md:grid-cols-2">
          <div><span className="label">Board DID</span><div className="mono" data-testid="board-did">{didString}</div></div>
          <div><span className="label">Licence registry</span><div className="mono" data-testid="board-registry">{board.registryAddress}</div></div>
        </div>
        {didDoc && (
          <details open className="text-xs">
            <summary className="cursor-pointer font-semibold">Resolved DID document (reference resolver, in-browser)</summary>
            <pre className="mono max-h-72 overflow-auto rounded bg-slate-50 p-2" data-testid="did-document">{JSON.stringify(didDoc, null, 2)}</pre>
          </details>
        )}
        <ErrorBox error={error} />
        {busy && <p className="text-sm text-amber-700" data-testid="board-busy">{busy}</p>}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-3">
          <h2 className="font-semibold">New licence</h2>
          <Field label="Practitioner DID (did:midnight:offchain:…)">
            <textarea className="input mono h-16" value={form.holderDid} onChange={(e) => setForm({ ...form, holderDid: e.target.value.trim() })} data-testid="issue-holder-did" />
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Name"><input className="input" value={form.holderName} onChange={(e) => setForm({ ...form, holderName: e.target.value })} data-testid="issue-name" /></Field>
            <Field label="Licence number"><input className="input" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} data-testid="issue-number" /></Field>
            <Field label="Category">
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: Number(e.target.value) })} data-testid="issue-category">
                {Object.entries(LICENSE_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Jurisdiction"><input className="input" value={form.jurisdiction} onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })} /></Field>
            <Field label="Issued"><input className="input" type="date" value={form.issuedAt} onChange={(e) => setForm({ ...form, issuedAt: e.target.value })} /></Field>
            <Field label="Expires"><input className="input" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} data-testid="issue-expires" /></Field>
          </div>
          <button className="btn" onClick={() => void issue()} disabled={!!busy || !form.holderDid} data-testid="issue">Issue licence</button>
          {lastBundle && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3" data-testid="issued-bundle">
              <div className="label mb-1">Licence bundle — give this to the practitioner (it is their private credential)</div>
              <Copyable value={lastBundle} testId="bundle-wire" />
              <button className="btn-secondary mt-2" onClick={() => void deliverLocally()} data-testid="deliver-local">Deliver to the practitioner wallet in this browser</button>
            </div>
          )}
        </section>

        <section className="card space-y-3">
          <h2 className="font-semibold">Licences</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500"><tr><th>#</th><th>Number</th><th>Holder</th><th>Category</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {board.licenses.length === 0 && <tr><td colSpan={6} className="py-2 text-slate-500">No licences issued yet.</td></tr>}
              {board.licenses.map((l) => (
                <tr key={l.leafIndex.toString()} className="border-t border-slate-100" data-testid={`license-row-${l.licenseNumber}`} data-revoked={l.revoked}>
                  <td className="mono py-1">{l.leafIndex.toString()}</td>
                  <td className="mono">{l.licenseNumber}</td>
                  <td>{l.holderName}</td>
                  <td>{LICENSE_CATEGORIES[l.category]}</td>
                  <td>{l.revoked ? <span className="chip chip-revoked">Revoked</span> : <span className="chip chip-active">Active</span>}</td>
                  <td className="text-right">
                    {!l.revoked && <button className="btn-danger" onClick={() => void revoke(l)} disabled={!!busy} data-testid={`revoke-${l.licenseNumber}`}>Revoke</button>}
                    {l.revokedTxHash && explorerTxUrl(board.network, l.revokedTxHash) && <a className="ml-2 text-xs underline" href={explorerTxUrl(board.network, l.revokedTxHash)!} target="_blank" rel="noreferrer">tx</a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};
