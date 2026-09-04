import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import wasm from "vite-plugin-wasm";

const here = path.dirname(fileURLToPath(import.meta.url));

// Adapted from an EDDA app running the same midnight-js 4.0.2 / ledger-v8 stack in Vite.
export default defineConfig(({ mode }) => ({
  root: here,
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
    "process.env": {},
    global: "globalThis",
  },
  plugins: [
    nodePolyfills({
      include: ["buffer", "process", "assert", "events", "util", "stream"],
      globals: { Buffer: true, process: true },
      protocolImports: true,
    }),
    wasm(),
    react(),
    viteCommonjs(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(here, "./src"),
    },
  },
  optimizeDeps: {
    esbuildOptions: { define: { global: "globalThis" } },
    // WASM packages are left to Vite's native handling; everything CommonJS around them is pre-bundled by esbuild so
    // package "browser" fields apply (object-inspect would otherwise require Node's util.inspect at load time).
    exclude: ["@midnight-ntwrk/onchain-runtime-v3", "@midnight-ntwrk/ledger-v8"],
    include: ["@midnight-ntwrk/compact-runtime", "@midnight-ntwrk/compact-runtime > object-inspect"],
  },
  server: {
    host: true,
    port: 5175,
    strictPort: true,
    fs: { allow: [path.resolve(here, "..")] },
  },
  preview: { port: 5175, strictPort: true },
  build: {
    target: "esnext",
    outDir: path.resolve(here, "./dist"),
    emptyOutDir: true,
    commonjsOptions: { transformMixedEsModules: true },
    chunkSizeWarningLimit: 6000,
  },
  worker: { format: "es", plugins: () => [wasm()] },
}));
