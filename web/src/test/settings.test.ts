import { describe, expect, it } from "vitest";
import { defaultSettings, explorerTxUrl } from "../settings";

describe("settings", () => {
  it("defaults to preprod outside dev-wallet builds", () => {
    expect(defaultSettings().networkId).toBe("preprod");
    expect(defaultSettings().localProofServerUrl).toBe("");
  });

  it("links public-network transactions to the explorer and none for standalone", () => {
    expect(explorerTxUrl("undeployed", "abc")).toBeNull();
    expect(explorerTxUrl("preprod", "abc")).toBe("https://explorer.1am.xyz/tx/abc?network=preprod");
  });
});
