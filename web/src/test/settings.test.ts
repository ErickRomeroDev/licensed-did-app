import { describe, expect, it, vi } from "vitest";
import { defaultSettings, explorerTxUrl, loadSettings } from "../settings";

describe("settings", () => {
  it("defaults to preview outside dev-wallet builds", () => {
    expect(defaultSettings().networkId).toBe("preview");
    expect(defaultSettings().localProofServerUrl).toBe("");
  });

  it("links public-network transactions to the explorer and none for standalone", () => {
    expect(explorerTxUrl("undeployed", "abc")).toBeNull();
    expect(explorerTxUrl("preview", "abc")).toBe("https://explorer.1am.xyz/tx/abc?network=preview");
  });

  it("moves saved preprod settings to preview", () => {
    const saved = JSON.stringify({ networkId: "preprod", boardName: "Kept" });
    vi.stubGlobal("localStorage", { getItem: () => saved });
    expect(loadSettings()).toMatchObject({ networkId: "preview", boardName: "Kept" });
    vi.unstubAllGlobals();
  });
});
