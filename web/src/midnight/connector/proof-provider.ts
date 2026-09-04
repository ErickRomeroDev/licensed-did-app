// Proving: delegated to the wallet through `getProvingProvider` (1AM routes to its ProofStation or the user's
// configured prover); a user-configured local proof server URL takes precedence as the fallback path.
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { createProofProvider, type ProofProvider, type ZKConfigProvider } from "@midnight-ntwrk/midnight-js-types";
import type { WalletSession } from "./types";

export type ProvingMode = { kind: "wallet" } | { kind: "local"; url: string };

export const makeProofProvider = async <K extends string>(
  session: WalletSession,
  zkConfigProvider: ZKConfigProvider<K>,
  localProofServerUrl: string | undefined,
): Promise<{ provider: ProofProvider; mode: ProvingMode }> => {
  if (localProofServerUrl && localProofServerUrl.trim() !== "") {
    return { provider: httpClientProofProvider(localProofServerUrl.trim(), zkConfigProvider), mode: { kind: "local", url: localProofServerUrl.trim() } };
  }
  try {
    const provingProvider = await session.api.getProvingProvider(zkConfigProvider.asKeyMaterialProvider());
    if (typeof provingProvider?.prove !== "function" || typeof provingProvider?.check !== "function") {
      throw new Error("wallet returned an incomplete proving provider (missing prove/check)");
    }
    return { provider: createProofProvider(provingProvider), mode: { kind: "wallet" } };
  } catch (e) {
    const legacy = session.configuration.proverServerUri;
    if (legacy) {
      console.warn("[licensed] wallet proving provider unavailable, falling back to configured prover URI", e);
      return { provider: httpClientProofProvider(legacy, zkConfigProvider), mode: { kind: "local", url: legacy } };
    }
    throw new Error(
      `This wallet does not expose a proving provider (${e instanceof Error ? e.message : String(e)}). ` +
        "Run a local proof server and set its URL in Settings.",
    );
  }
};
