// Assembles midnight-js providers for one contract from a connected wallet session.
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import type { MidnightProviders, PublicDataProvider } from "@midnight-ntwrk/midnight-js-types";
import { makeProofProvider, type ProvingMode } from "./connector/proof-provider";
import type { WalletSession } from "./connector/types";
import { connectorWalletProviders } from "./connector/wallet-provider";
import { inMemoryPrivateStateProvider } from "./private-state-provider";
import { CachedFetchZkConfigProvider, zkAssetsBaseUrl } from "./zk-config-provider";

export type ContractName = "license-registry" | "did";

export type ProviderBundle<K extends string, PSI extends string, PS> = {
  providers: MidnightProviders<K, PSI, PS>;
  provingMode: ProvingMode;
};

const publicDataCache = new Map<string, PublicDataProvider>();

/** Read-only indexer access (used by the verifier and the practitioner's status polling; no wallet needed). */
export const publicDataFor = (indexerUri: string, indexerWsUri: string): PublicDataProvider => {
  const key = `${indexerUri}|${indexerWsUri}`;
  let p = publicDataCache.get(key);
  if (!p) {
    p = indexerPublicDataProvider(indexerUri, indexerWsUri);
    publicDataCache.set(key, p);
  }
  return p;
};

export const makeProviders = async <K extends string, PSI extends string, PS>(
  session: WalletSession,
  contractName: ContractName,
  options: { localProofServerUrl?: string; onDownload?: (state: "start" | "done", circuitId: string) => void } = {},
): Promise<ProviderBundle<K, PSI, PS>> => {
  const zkConfigProvider = new CachedFetchZkConfigProvider<K>(zkAssetsBaseUrl(contractName), options.onDownload);
  const { provider: proofProvider, mode } = await makeProofProvider(session, zkConfigProvider, options.localProofServerUrl);
  const walletAndMidnight = connectorWalletProviders(session);
  const providers: MidnightProviders<K, PSI, PS> = {
    privateStateProvider: inMemoryPrivateStateProvider<PSI, PS>(),
    publicDataProvider: publicDataFor(session.configuration.indexerUri, session.configuration.indexerWsUri),
    zkConfigProvider,
    proofProvider,
    walletProvider: walletAndMidnight,
    midnightProvider: walletAndMidnight,
  };
  return { providers, provingMode: mode };
};
