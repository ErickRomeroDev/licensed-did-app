import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = path.dirname(fileURLToPath(import.meta.url));

// Integration tests against the local standalone stack (infra/standalone.yml). Long timeouts: every step is a
// real transaction with a real proof. MIDNIGHT_DID_ZK_CONFIG_PATH must be set before midnight-did-api loads.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
    pool: "forks",
    fileParallelism: false,
    testTimeout: 30 * 60_000,
    hookTimeout: 30 * 60_000,
    reporters: ["verbose"],
    env: {
      MIDNIGHT_DID_ZK_CONFIG_PATH:
        process.env.MIDNIGHT_DID_ZK_CONFIG_PATH ?? path.resolve(here, "../.cache/did-zk-0.5.0"),
      LICENSED_REGISTRY_ZK_PATH:
        process.env.LICENSED_REGISTRY_ZK_PATH ?? path.resolve(here, "../contract/src/managed/license-registry"),
    },
  },
  resolve: {
    conditions: ["import", "node", "default"],
  },
});
