import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

test.describe("UX-G167 Activity CSV exports: authorized desktop/mobile downloads", () => {
  test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED !== "true",
    "Requires isolated seeded authenticated browser test database");

  test("super-admin desktop sees all-matching export with safe response headers", async ({page, context}) => {
    await authenticateGracefulRole(context, "superadmin");
    await page.setViewportSize({width:1280,height:800});
    await page.goto("/activity?view=all&range=ALL");
    await expect(page.getByRole("heading", {name:"Activity Log",level:1})).toBeVisible();
    const link=page.getByRole("link",{name:"Export all matching CSV"});
    // A freshly seeded activity log may legitimately have zero matching rows.
    const href=await link.count()?await link.getAttribute("href"):"/api/activity/admin-export";
    if(await link.count())await expect(link).toBeVisible();
    else await expect(page.getByText("Export unavailable (no matching activity)")).toBeVisible();
    expect(href).toContain("/api/activity/admin-export");
    const response=await page.request.get(href!);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/csv");
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["content-disposition"]).toContain("attachment");
    expect(response.headers()["x-export-row-cap"]).toBe("1000");
    const csv=await response.text();
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Time","Who","What","Item","Action key","IP"');
    await page.screenshot({path:"test-results/ux-g167-admin-desktop.png",fullPage:true});
  });

  test("college-admin mobile exports only scoped activity and learner is denied", async ({page,context}) => {
    await authenticateGracefulRole(context, "college");
    await page.setViewportSize({width:390,height:844});
    await page.goto("/activity?view=all&range=ALL");
    await expect(page.getByRole("heading", {name:"Activity Log",level:1})).toBeVisible();
    const link=page.getByRole("link",{name:"Export all matching CSV"});
    // A freshly seeded activity log may legitimately have zero matching rows.
    const href=await link.count()?await link.getAttribute("href"):"/api/activity/college-export";
    if(await link.count())await expect(link).toBeVisible();
    else await expect(page.getByText("Export unavailable (no matching activity)")).toBeVisible();
    expect(href).toContain("/api/activity/college-export");
    const response=await page.request.get(href!);
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["x-export-row-cap"]).toBe("1000");
    const csv=await response.text();
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Time","Who","What","Item","Action key","IP"');
    expect(csv).not.toContain('"127.0.0.1"');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    await page.screenshot({path:"test-results/ux-g167-college-mobile.png",fullPage:true});

    await authenticateGracefulRole(context, "learner");
    const denied=await page.request.get("/api/activity/college-export");
    expect(denied.ok()).toBe(false);
  });
});
