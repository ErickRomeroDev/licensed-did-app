#!/usr/bin/env node
// Downloads and verifies the midnight-did ZK artifact tarball (prover/verifier keys + ZKIR for the did:midnight
// contract) into <repo>/.cache/did-zk-<version>/ with the FetchZkConfigProvider layout (keys/, zkir/).
// Used by web/scripts/copy-zk-assets.mjs and by the deploy/ integration tests. Idempotent.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

export const DID_ARTIFACTS_VERSION = process.env.MIDNIGHT_DID_ARTIFACTS_VERSION ?? "0.5.0";
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DID_ARTIFACTS_DIR = path.join(REPO_ROOT, ".cache", `did-zk-${DID_ARTIFACTS_VERSION}`);

const base = `https://github.com/midnightntwrk/midnight-did/releases/download/v${DID_ARTIFACTS_VERSION}`;
const tarName = `midnight-did-zk-artifacts-${DID_ARTIFACTS_VERSION}.tar.gz`;

const download = async (url) => {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
};

export const ensureDidArtifacts = async () => {
  if (existsSync(path.join(DID_ARTIFACTS_DIR, "keys")) && existsSync(path.join(DID_ARTIFACTS_DIR, "zkir"))) {
    return DID_ARTIFACTS_DIR;
  }
  mkdirSync(DID_ARTIFACTS_DIR, { recursive: true });
  const tarPath = path.join(DID_ARTIFACTS_DIR, tarName);
  if (!existsSync(tarPath)) {
    console.log(`[did-artifacts] downloading ${tarName} ...`);
    const bytes = await download(`${base}/${tarName}`);
    const expectedHex = new TextDecoder().decode(await download(`${base}/${tarName}.sha256`)).trim().split(/\s+/)[0];
    const actualHex = createHash("sha256").update(bytes).digest("hex");
    if (expectedHex && expectedHex !== actualHex) {
      throw new Error(`[did-artifacts] sha256 mismatch: expected ${expectedHex}, got ${actualHex}`);
    }
    writeFileSync(tarPath, bytes);
    console.log(`[did-artifacts] sha256 ok ${actualHex}`);
  }
  execFileSync("tar", ["xzf", tarPath, "-C", DID_ARTIFACTS_DIR]);
  const manifest = JSON.parse(readFileSync(path.join(DID_ARTIFACTS_DIR, "manifest.json"), "utf8"));
  console.log(`[did-artifacts] ${manifest.packageName}@${manifest.version} (compact ${manifest.compactCompilerVersion}) -> ${DID_ARTIFACTS_DIR}`);
  return DID_ARTIFACTS_DIR;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  ensureDidArtifacts().then((dir) => console.log(dir)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
