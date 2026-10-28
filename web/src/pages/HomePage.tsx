import { Link } from "react-router";
import { useSession } from "@/app/session";
import { Field } from "@/components/ui";
import { isDevWalletBuild } from "@/settings";

export const HomePage = () => {
  const { settings, updateSettings, wallets, refreshWallets, session } = useSession();
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="card space-y-3">
        <h1 className="text-xl font-bold">Private, revocable professional licences on did:midnight</h1>
        <p className="text-sm text-slate-700">
          A licensing <b>board</b> creates its own did:midnight identity and licence registry from this browser and issues a
          credential. A <b>practitioner</b> holds it privately. A <b>hiring platform</b> learns one thing — “active licence in
          category X from board B” — from a zero-knowledge proof, and sees revocation without ever contacting the board.
        </p>
        <p className="text-xs text-slate-500">
          Built by Erick Romero ·{" "}
          <a className="underline hover:text-slate-700" href="https://x.com/ErickRomeroEdda" target="_blank" rel="noreferrer">
            @ErickRomeroEdda
          </a>{" "}
          ·{" "}
          <a className="underline hover:text-slate-700" href="https://eddalabs.io" target="_blank" rel="noreferrer">
            EDDA Labs
          </a>
        </p>
        <h2 className="font-semibold">Before you start</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          <li>Install the <a className="underline" href="https://1am.xyz" target="_blank" rel="noreferrer">1AM wallet</a> extension and create a wallet.</li>
          <li>Switch it to <b>{settings.networkId}</b>.</li>
          <li>Get test NIGHT from the <a className="underline" href={`https://faucet.${settings.networkId}.midnight.network`} target="_blank" rel="noreferrer">faucet</a> (captcha).</li>
          <li>Wait until the wallet shows a <b>DUST</b> balance (fees). First fees arrive within minutes.</li>
          <li>Connect the wallet (top right) and pick a role below. One wallet is enough to play every role on one machine.</li>
        </ol>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link to="/board" className="btn">Board</Link>
          <Link to="/wallet" className="btn">Practitioner</Link>
          <Link to="/verify" className="btn">Hiring platform</Link>
        </div>
      </section>
      <section className="card space-y-3">
        <h2 className="font-semibold">Settings</h2>
        <Field label="Network">
          <select className="input" value={settings.networkId} onChange={(e) => updateSettings({ networkId: e.target.value })} disabled={!!session}>
            <option value="preview">preview</option>
            <option value="undeployed">undeployed (local standalone)</option>
          </select>
        </Field>
        <Field label="Local proof server URL (optional fallback; leave empty to prove through the wallet)">
          <input className="input" placeholder="http://localhost:6300" value={settings.localProofServerUrl} onChange={(e) => updateSettings({ localProofServerUrl: e.target.value })} />
        </Field>
        <div className="text-sm">
          <div className="label">Wallets detected</div>
          <ul className="mt-1 space-y-1">
            {wallets.length === 0 && <li className="text-slate-500">none yet — <button className="underline" onClick={() => void refreshWallets()}>rescan</button></li>}
            {wallets.map((w) => (
              <li key={w.key} className="mono">{w.api.name} <span className="text-slate-400">({w.api.rdns ?? w.key}, api {w.api.apiVersion})</span></li>
            ))}
          </ul>
          {isDevWalletBuild() && <p className="mt-2 text-xs text-amber-700">Dev build: an in-page standalone wallet is installed for local testing.</p>}
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold">What you trust</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
            <li>Your wallet balances, pays, signs and submits. Its proving backend sees the private inputs of every proof.</li>
            <li>The board’s secrets live in the board operator’s browser (export them!).</li>
            <li>The verifier reads only the public indexer. It never talks to the board.</li>
          </ul>
        </details>
      </section>
    </div>
  );
};
