// FetchZkConfigProvider (4.0.2 constructor: (baseURL, fetchFunc)) with an in-memory cache so a multi-MB prover key
// is downloaded once per session. Assets live under /midnight/<contract>/{keys,zkir}.
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import type { ProverKey, VerifierKey, ZKIR } from "@midnight-ntwrk/midnight-js-types";

export const zkAssetsBaseUrl = (contractName: "license-registry" | "did"): string =>
  `${window.location.origin}/midnight/${contractName}`;

export class CachedFetchZkConfigProvider<K extends string> extends FetchZkConfigProvider<K> {
  private readonly cache = new Map<string, Promise<ProverKey | VerifierKey | ZKIR>>();

  constructor(baseURL: string, private readonly onDownload?: (state: "start" | "done", circuitId: string) => void) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(baseURL, fetch.bind(window) as any);
  }

  private memo<T extends ProverKey | VerifierKey | ZKIR>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit) return hit as Promise<T>;
    const p = load().catch((e) => {
      this.cache.delete(key);
      throw e;
    });
    this.cache.set(key, p);
    return p;
  }

  override async getProverKey(circuitId: K): Promise<ProverKey> {
    return this.memo(`prover:${circuitId}`, async () => {
      this.onDownload?.("start", circuitId);
      try {
        return await super.getProverKey(circuitId);
      } finally {
        this.onDownload?.("done", circuitId);
      }
    });
  }

  override getVerifierKey(circuitId: K): Promise<VerifierKey> {
    return this.memo(`verifier:${circuitId}`, () => super.getVerifierKey(circuitId));
  }

  override getZKIR(circuitId: K): Promise<ZKIR> {
    return this.memo(`zkir:${circuitId}`, () => super.getZKIR(circuitId));
  }
}
