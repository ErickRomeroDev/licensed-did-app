import { useSession } from "@/app/session";

export const WalletBar = () => {
  const { session, wallets, connect, connecting, connectError, disconnect, settings, zkDownload } = useSession();
  if (session) {
    return (
      <div className="flex items-center gap-2 text-xs" data-testid="wallet-bar">
        {zkDownload && <span className="chip chip-waiting">{zkDownload}</span>}
        <span className="chip chip-active" data-testid="wallet-connected">
          {session.walletName} · {session.networkId}
        </span>
        <button className="btn-secondary" onClick={disconnect}>
          Disconnect
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs" data-testid="wallet-bar">
      {connectError && <span className="max-w-xs truncate text-rose-700" title={connectError}>{connectError}</span>}
      <span className="chip chip-neutral">{settings.networkId}</span>
      <button className="btn" data-testid="connect-wallet" disabled={connecting} onClick={() => void connect().catch(() => {})}>
        {connecting ? "Connecting…" : wallets[0] ? `Connect ${wallets[0].api.name}` : "Connect wallet"}
      </button>
    </div>
  );
};
