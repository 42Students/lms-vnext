import { expect, test, type BrowserContext } from "@playwright/test";
import {
  E2E_IDENTITY_COOKIE_NAME,
  E2E_SECRET_COOKIE_NAME,
} from "../../src/auth/e2e-identity";
import { SEED_IDS } from "../../scripts/db-seed-data";

const baseUrl = "http://localhost:3000";
const secret = process.env.E2E_AUTH_SECRET;
const leadId = "d9d9d9d9-1a1a-4b4b-9c9c-2d2d2d2d2d2d";

async function tpoLogin(context: BrowserContext) {
  if (!secret) throw new Error("E2E_AUTH_SECRET required");
  await context.clearCookies();
  await context.addCookies([
    { name: E2E_IDENTITY_COOKIE_NAME, value: "seed-shared-faculty", url: baseUrl,
      httpOnly: true, sameSite: "Lax" },
    { name: E2E_SECRET_COOKIE_NAME, value: secret, url: baseUrl,
      httpOnly: true, sameSite: "Lax" },
    { name: "lms_membership", value: SEED_IDS.facultyCollegeAMembership, url: baseUrl,
      httpOnly: true, sameSite: "Lax" },
  ]);
}

const lead = {
  id: leadId, name: "Example Recruiter", emailNorm: "person@example.org",
  phoneNorm: "9876543210", companyName: "Example Co",
  designation: "Recruiting Lead", source: "ALUMNI",
  manualStage: "NEW", notNowReason: null, notNowUntil: null,
  inviteSentAt: null, recruiterUserId: null,
};

test.describe("W05 recruiter CRM source-parity browser contract", () => {
  test.skip(!secret, "E2E_AUTH_SECRET and seeded TPO membership required");

  test("never renders a false empty list while DB09 migration gate is closed", async ({ page, context }) => {
    await tpoLogin(context);
    await page.goto("/tpo/recruiters");
    await expect(page.getByRole("heading", { name: "Recruiter Leads" })).toBeVisible();
    await expect(page.getByRole("alert")).toContainText(/awaiting database verification/i);
    await expect(page.getByRole("button", { name: "Add recruiter lead" })).toBeDisabled();
    await expect(page.getByText("No recruiter leads yet")).toHaveCount(0);
  });

  test("shows table/board, flags existing contact, and links to exact detail route", async ({ page, context }) => {
    await tpoLogin(context);
    await page.route(/\/api\/placements\/tpo\/leads\?/, async route => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ leads: [lead] }) });
    });
    await page.route(/\/api\/placements\/tpo\/leads\/check\?/, async route => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ lead }) });
    });
    await page.goto("/tpo/recruiters");
    await expect(page.getByRole("link", { name: "Example Recruiter" })).toHaveAttribute(
      "href", "/tpo/recruiters/" + leadId,
    );
    await page.getByLabel("View").selectOption("board");
    await expect(page.getByRole("heading", { name: "NEW · 1" })).toBeVisible();
    await page.getByRole("button", { name: "Add recruiter lead" }).click();
    await page.getByRole("dialog", { name: "Add recruiter lead" }).getByLabel("Name *").fill("Another Person");
    await page.getByRole("dialog").getByLabel("Email").fill("person@example.org");
    await page.getByRole("button", { name: "Check for existing contact" }).click();
    await expect(page.getByRole("dialog").getByText(/Contact already exists:/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Create recruiter lead" })).toBeDisabled();
  });

  test("shows detail timeline and correctly refreshes after manual Contacted mutation", async ({ page, context }) => {
    await tpoLogin(context);
    let current = { ...lead };
    await page.route(/\/api\/placements\/tpo\/leads\/[a-f0-9-]+\?/, async route => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ lead: current }) });
    });
    await page.route(/\/api\/placements\/tpo\/leads\/[a-f0-9-]+\/activity\?/, async route => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ activities: [{
          id: "activity-1", type: "CALL", outcome: "CONNECTED",
          note: "Discussed hiring", createdAt: "2026-10-10T06:00:00Z",
        }] }) });
    });
    await page.route(/\/api\/placements\/tpo\/leads\/[a-f0-9-]+\/follow-ups\?/, async route => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ followups: [] }) });
    });
    await page.route(/\/api\/placements\/tpo\/leads\/[a-f0-9-]+\/contacted$/, async route => {
      current = { ...current, manualStage: "CONTACTED" };
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ lead: current }) });
    });
    await page.goto("/tpo/recruiters/" + leadId);
    await expect(page.getByRole("heading", { name: lead.name })).toBeVisible();
    await expect(page.getByText("Discussed hiring")).toBeVisible();
    await page.getByRole("button", { name: "Mark contacted" }).click();
    await expect(page.getByText("Stage: CONTACTED")).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark contacted" })).toHaveCount(0);
  });
});
