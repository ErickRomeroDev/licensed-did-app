// The demo storyline (spec §3.4) in a real browser against the local standalone stack, using the dev connector shim.
// Every step is a real transaction with a real proof; the whole run takes several minutes.
import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const shot = async (page: Page, name: string) => page.screenshot({ path: `e2e/artifacts/${name}.png`, fullPage: true });
// Client-side navigation keeps the in-page wallet session alive (a full reload would rebuild and resync it).
const nav = async (page: Page, label: "Start" | "Board" | "Practitioner" | "Hiring platform") => {
  await page.getByRole("navigation").getByRole("link", { name: label, exact: true }).click();
};

test("issue → hold → present → revoke → present fails", async ({ page }) => {
  test.setTimeout(30 * 60_000);
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning" || m.type() === "info") console.log(`[browser:${m.type()}] ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => console.log(`[browser:pageerror] ${e.message.slice(0, 500)}`));
  page.on("requestfailed", (r) => console.log(`[browser:requestfailed] ${r.url().slice(0, 200)} ${r.failure()?.errorText ?? ""}`));

  // 0. Landing page: dev wallet detected, connect.
  await page.goto("/");
  await expect(page.getByText("Wallets detected")).toBeVisible();
  await expect(page.getByTestId("connect-wallet")).toContainText("Dev Standalone Wallet", { timeout: 15_000 });
  await page.getByTestId("connect-wallet").click();
  // First connect syncs the in-page wallet from genesis and registers for DUST: allow several minutes.
  await expect(page.getByTestId("wallet-connected")).toBeVisible({ timeout: 10 * 60_000 });
  await shot(page, "00-connected");

  // 1. Board creates itself (4 transactions).
  await nav(page, "Board");
  await page.getByTestId("board-name").fill("State Electrical Licensing Board");
  await page.getByTestId("create-board").click();
  for (let i = 0; i <= 3; i++) {
    await expect(page.getByTestId(`step-${i}`)).toHaveAttribute("data-state", "done", { timeout: 10 * 60_000 });
  }
  // The steps list is replaced by the board view as soon as the last transaction finalizes.
  await expect(page.getByTestId("board-header")).toBeVisible({ timeout: 10 * 60_000 });
  const boardDid = (await page.getByTestId("board-did").textContent())!.trim();
  const registryAddress = (await page.getByTestId("board-registry").textContent())!.trim();
  expect(boardDid).toMatch(/^did:midnight:undeployed:[0-9a-f]{64}$/);
  expect(registryAddress).toMatch(/^[0-9a-f]{64}$/);
  console.log(`board DID ${boardDid}\nregistry ${registryAddress}`);
  await shot(page, "01-board-created");

  // Resolve the DID through the reference resolver and check #key-assert is an assertionMethod.
  await page.getByTestId("resolve-did").click();
  const didDoc = page.getByTestId("did-document");
  await expect(didDoc).toBeVisible({ timeout: 60_000 });
  await expect(didDoc).toContainText("#key-assert");
  await expect(didDoc).toContainText("assertionMethod");
  await shot(page, "02-did-resolved");

  // 2. Practitioner creates an identity.
  await nav(page, "Practitioner");
  await page.getByTestId("create-identity").click();
  const holderDid = (await page.getByTestId("holder-did").inputValue()).trim();
  expect(holderDid.startsWith("did:midnight:offchain:")).toBe(true);
  await shot(page, "03-identity");

  // 3. Board issues a licence to that DID.
  await nav(page, "Board");
  await page.getByTestId("issue-holder-did").fill(holderDid);
  await page.getByTestId("issue-name").fill("Ada Lovelace");
  await page.getByTestId("issue-number").fill("CA-4471");
  await page.getByTestId("issue-category").selectOption("1");
  await page.getByTestId("issue").click();
  await expect(page.getByTestId("issued-bundle")).toBeVisible({ timeout: 10 * 60_000 });
  await expect(page.getByTestId("license-row-CA-4471")).toHaveAttribute("data-revoked", "false");
  const bundle = await page.getByTestId("bundle-wire").inputValue();
  await shot(page, "04-issued");

  // Practitioner receives it (paste) and sees it Active from the public tree.
  await nav(page, "Practitioner");
  await page.getByTestId("incoming-license").fill(bundle);
  await page.getByTestId("receive-license").click();
  const card = page.getByTestId("license-card");
  await expect(card).toBeVisible();
  await expect(page.getByTestId("license-status")).toHaveText("Active", { timeout: 60_000 });
  await shot(page, "05-held-active");

  // 4. Hiring platform requests a proof.
  await nav(page, "Hiring platform");
  await page.getByTestId("verify-registry").fill(registryAddress);
  await page.getByTestId("verify-category").selectOption("1");
  await page.getByTestId("request-proof").click();
  const request1 = await page.getByTestId("request-wire").inputValue();
  await expect(page.getByTestId("registry-panel")).toBeVisible({ timeout: 60_000 });
  const rootBefore = (await page.getByTestId("registry-root").textContent())!;
  await shot(page, "06-request-1");

  // Practitioner proves.
  await nav(page, "Practitioner");
  await page.getByTestId("request-input").fill(request1);
  await page.getByTestId("parse-request").click();
  await expect(page.getByTestId("request-summary")).toContainText("active electrician licence");
  await page.getByTestId("prove").click();
  await expect(page.getByTestId("prove-success")).toBeVisible({ timeout: 10 * 60_000 });
  await shot(page, "07-proved");

  // Platform sees Verified without contacting the board.
  await nav(page, "Hiring platform");
  await expect(page.locator('[data-testid^="request-"][data-status="verified"]').first()).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText(/Verified — active electrician licence/)).toBeVisible();
  await shot(page, "08-verified");

  // 5. Board revokes.
  await nav(page, "Board");
  await page.getByTestId("revoke-CA-4471").click();
  await expect(page.getByTestId("license-row-CA-4471")).toHaveAttribute("data-revoked", "true", { timeout: 10 * 60_000 });
  await shot(page, "09-revoked-board");

  // Practitioner's card flips to Revoked from the public tree.
  await nav(page, "Practitioner");
  await expect(page.getByTestId("license-status")).toHaveText("Revoked", { timeout: 60_000 });
  await shot(page, "10-revoked-wallet");

  // Platform: root changed, revoked count 1, and a fresh challenge cannot be answered.
  await nav(page, "Hiring platform");
  await expect(page.getByTestId("registry-counts")).toHaveText("1 / 1", { timeout: 60_000 });
  const rootAfter = (await page.getByTestId("registry-root").textContent())!;
  expect(rootAfter).not.toBe(rootBefore);
  await page.getByTestId("request-proof").click();
  const request2 = await page.getByTestId("request-wire").inputValue();
  await shot(page, "11-request-2");

  await nav(page, "Practitioner");
  await page.getByTestId("request-input").fill(request2);
  await page.getByTestId("parse-request").click();
  await page.getByTestId("prove").click();
  await expect(page.getByTestId("error")).toContainText(/revoked or unknown/, { timeout: 120_000 });
  await shot(page, "12-prove-fails-after-revoke");

  await nav(page, "Hiring platform");
  await expect(page.locator('[data-testid^="request-"][data-status="waiting"]').first()).toBeVisible();
  await expect(page.locator('[data-testid^="request-"][data-status="verified"]')).toHaveCount(1);
  await shot(page, "13-second-request-unanswered");
});
