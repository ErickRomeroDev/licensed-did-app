#!/usr/bin/env node
// Stages the ZK assets the browser needs under web/public/midnight/ in FetchZkConfigProvider layout:
//   public/midnight/license-registry/{keys,zkir}  <- contract/src/managed/license-registry (our compiled circuits)
//   public/midnight/did/{keys,zkir}               <- midnight-did 0.5.0 release artifacts (downloaded + verified)
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDidArtifacts } from "../../scripts/fetch-did-artifacts.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, "..");
const managed = path.resolve(webRoot, "../contract/src/managed/license-registry");
const publicMidnight = path.join(webRoot, "public", "midnight");

if (!existsSync(path.join(managed, "keys"))) {
  console.error(`[zk-assets] missing ${managed}/keys — run: pnpm --filter @licensed/contract compact`);
  process.exit(1);
}

const stage = (src, name) => {
  const dst = path.join(publicMidnight, name);
  rmSync(dst, { recursive: true, force: true });
  mkdirSync(dst, { recursive: true });
  cpSync(path.join(src, "keys"), path.join(dst, "keys"), { recursive: true });
  cpSync(path.join(src, "zkir"), path.join(dst, "zkir"), { recursive: true });
  console.log(`[zk-assets] ${name} <- ${src}`);
};

stage(managed, "license-registry");
stage(await ensureDidArtifacts(), "did");
