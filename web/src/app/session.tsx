// App-wide session: settings, wallet connection, provider bundles per contract, read-only indexer access.
import type { PublicDataProvider } from "@midnight-ntwrk/midnight-js-types";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { connectWallet, waitForWallets, type DiscoveredWallet } from "@/midnight/connector/connect";
import type { WalletSession } from "@/midnight/connector/types";
import { makeProviders, publicDataFor, type ContractName, type ProviderBundle } from "@/midnight/providers";
import { defaultSettings, isDevWalletBuild, loadSettings, saveSettings, type Settings } from "@/settings";

export const NETWORK_ENDPOINTS: Record<string, { indexer: string; indexerWS: string }> = {
  undeployed: { indexer: "http://127.0.0.1:8088/api/v4/graphql", indexerWS: "ws://127.0.0.1:8088/api/v4/graphql/ws" },
  preview: { indexer: "https://indexer.preview.midnight.network/api/v4/graphql", indexerWS: "wss://indexer.preview.midnight.network/api/v4/graphql/ws" },
  preprod: { indexer: "https://indexer.preprod.midnight.network/api/v4/graphql", indexerWS: "wss://indexer.preprod.midnight.network/api/v4/graphql/ws" },
};

export const WALLETS_CHANGED_EVENT = "licensed:wallets-changed";

export type SessionContextValue = {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  wallets: DiscoveredWallet[];
  refreshWallets: () => Promise<void>;
  session: WalletSession | null;
  connecting: boolean;
  connectError: string | null;
  connect: (wallet?: DiscoveredWallet) => Promise<WalletSession>;
  disconnect: () => void;
  /** Providers for a contract, built lazily per session (wallet needed). */
  providersFor: <K extends string, PSI extends string, PS>(name: ContractName) => Promise<ProviderBundle<K, PSI, PS>>;
  /** Read-only indexer access for the current network (no wallet needed). */
  publicData: () => PublicDataProvider;
  zkDownload: string | null;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [wallets, setWallets] = useState<DiscoveredWallet[]>([]);
  const [session, setSession] = useState<WalletSession | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [zkDownload, setZkDownload] = useState<string | null>(null);
  const bundles = useRef(new Map<string, Promise<ProviderBundle<string, string, unknown>>>());
  // Live session for async flows that connect and then immediately build providers within one click handler.
  const sessionRef = useRef<WalletSession | null>(null);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
    bundles.current.clear();
  }, []);

  const refreshWallets = useCallback(async () => {
    setWallets(await waitForWallets(isDevWalletBuild() ? 3_000 : 1_500));
  }, []);

  useEffect(() => {
    void refreshWallets();
    const onChanged = () => void refreshWallets();
    window.addEventListener(WALLETS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(WALLETS_CHANGED_EVENT, onChanged);
  }, [refreshWallets]);

  const connect = useCallback(
    async (wallet?: DiscoveredWallet): Promise<WalletSession> => {
      const target = wallet ?? wallets[0] ?? (await waitForWallets(3_000))[0];
      if (!target) throw new Error("No Midnight wallet found. Install the 1AM extension (or enable the dev wallet build).");
      setConnecting(true);
      setConnectError(null);
      try {
        const s = await connectWallet(target, settings.networkId);
        bundles.current.clear();
        sessionRef.current = s;
        setSession(s);
        return s;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setConnectError(msg);
        throw e;
      } finally {
        setConnecting(false);
      }
    },
    [wallets, settings.networkId],
  );

  const disconnect = useCallback(() => {
    sessionRef.current = null;
    setSession(null);
    bundles.current.clear();
  }, []);

  const providersFor = useCallback(
    <K extends string, PSI extends string, PS>(name: ContractName): Promise<ProviderBundle<K, PSI, PS>> => {
      const live = sessionRef.current;
      if (!live) return Promise.reject(new Error("Connect a wallet first"));
      const key = `${live.rdns}:${name}:${settings.localProofServerUrl}`;
      let p = bundles.current.get(key);
      if (!p) {
        p = makeProviders<string, string, unknown>(live, name, {
          localProofServerUrl: settings.localProofServerUrl,
          onDownload: (state, circuitId) => setZkDownload(state === "start" ? `Downloading prover key for ${circuitId}…` : null),
        });
        bundles.current.set(key, p);
        p.catch(() => bundles.current.delete(key));
      }
      return p as Promise<ProviderBundle<K, PSI, PS>>;
    },
    [settings.localProofServerUrl],
  );

  const publicData = useCallback((): PublicDataProvider => {
    if (session) return publicDataFor(session.configuration.indexerUri, session.configuration.indexerWsUri);
    const ep = NETWORK_ENDPOINTS[settings.networkId] ?? NETWORK_ENDPOINTS[defaultSettings().networkId]!;
    return publicDataFor(ep.indexer, ep.indexerWS);
  }, [session, settings.networkId]);

  const value = useMemo<SessionContextValue>(
    () => ({ settings, updateSettings, wallets, refreshWallets, session, connecting, connectError, connect, disconnect, providersFor, publicData, zkDownload }),
    [settings, updateSettings, wallets, refreshWallets, session, connecting, connectError, connect, disconnect, providersFor, publicData, zkDownload],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = (): SessionContextValue => {
  const v = useContext(SessionContext);
  if (!v) throw new Error("useSession outside SessionProvider");
  return v;
};
