import { expect, test } from "@playwright/test";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { authenticateGracefulRole } from "./support/roles";

const enabled = process.env.E2E_AUTH_ENABLED === "true" && Boolean(process.env.E2E_AUTH_SECRET);

test.describe("UX-G132 — persisted policy, review/cancel/reset and tenant denials", () => {
  test.skip(!enabled, "Requires isolated PostgreSQL and test-only E2E identities");

  test("Super Admin edits policy only within verified college scope, at desktop and mobile", async ({page,context}, info) => {
    test.setTimeout(120_000);
    await authenticateGracefulRole(context, "superadmin");
    await page.setViewportSize({width:1280,height:800});
    await page.goto("/admin/attendance");
    const scope = await page.evaluate(async (collegeId) => {
      const choices = await fetch("/api/auth/admin-scope", {credentials:"same-origin"});
      if (!choices.ok) return {ok:false, reason:"admin scope choices unavailable"};
      const data = await choices.json() as {choices:{colleges:{id:string}[]}};
      if (!data.choices.colleges.some(c => c.id === collegeId))
        return {ok:false, reason:"seed college absent from authorized choices"};
      const result = await fetch("/api/auth/admin-scope", {
        method:"POST",credentials:"same-origin",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({kind:"college",collegeId}),
      });
      return {ok:result.ok, reason:result.status.toString()};
    }, SEED_IDS.collegeA);
    expect(scope, "Super Admin must select a real, permission-validated college").toEqual({ok:true,reason:"200"});
    await page.goto("/college/attendance/settings");
    await expect(page.getByRole("heading",{level:2,name:"College attendance policy"})).toBeVisible();

    const threshold = page.locator("#attendance-eligibility-threshold");
    const hours = page.locator("#attendance-correction-window");
    const original = await threshold.inputValue();
    const previousHours = await hours.inputValue();
    const next = original === "80" ? "81" : "80";

    await threshold.fill("0");
    await expect(page.getByRole("button",{name:"Save attendance policy"})).toBeDisabled();
    await threshold.fill(next);
    await page.getByRole("button",{name:"Save attendance policy"}).click();
    const review = page.getByRole("alertdialog",{name:"Apply attendance policy changes?"});
    await expect(review).toContainText("Eligibility threshold: " + next + "%");
    await review.getByRole("button",{name:"Cancel"}).click();
    await expect(review).toHaveCount(0);

    await page.getByRole("button",{name:"Save attendance policy"}).click();
    const savedResponse = page.waitForResponse(r =>
      r.url().endsWith("/api/attendance/admin/policy") && r.request().method() === "PUT");
    await page.getByRole("alertdialog",{name:"Apply attendance policy changes?"})
      .getByRole("button",{name:"Save policy"}).click();
    const saved = await savedResponse;
    expect(saved.status()).toBe(200);
    const savedPolicy = await saved.json() as {policy:{eligibilityThresholdPercent:number;correctionWindowHours:number}};
    expect(savedPolicy.policy.eligibilityThresholdPercent).toBe(Number(next));
    expect(savedPolicy.policy.correctionWindowHours).toBe(Number(previousHours));
    await expect(page.getByRole("status").filter({hasText:"Attendance policy saved."})).toBeVisible();
    await page.screenshot({path:info.outputPath("g132-superadmin-policy-saved-desktop.png"),fullPage:true});

    // The same college scope cannot write another tenant's policy, even by direct API.
    const crossTenantStatus = await page.evaluate(async (collegeId) => {
      const response = await fetch("/api/attendance/admin/policy",{
        method:"PUT",credentials:"same-origin",headers:{"content-type":"application/json"},
        body:JSON.stringify({collegeId,eligibilityThresholdPercent:60,correctionWindowHours:12}),
      });
      return response.status;
    },SEED_IDS.collegeB);
    expect([401,403,404], "Super Admin scoped to college A must not mutate college B").toContain(crossTenantStatus);

    // Reset test data before other seeded acceptance jobs inspect the DB.
    await threshold.fill(original);
    await page.getByRole("button",{name:"Save attendance policy"}).click();
    const restoredResponse = page.waitForResponse(r =>
      r.url().endsWith("/api/attendance/admin/policy") && r.request().method() === "PUT");
    await page.getByRole("alertdialog",{name:"Apply attendance policy changes?"})
      .getByRole("button",{name:"Save policy"}).click();
    expect((await restoredResponse).status()).toBe(200);
    await page.setViewportSize({width:390,height:844});
    await page.goto("/college/attendance/settings");
    expect(await threshold.inputValue()).toBe(original);
    expect(await hours.inputValue()).toBe(previousHours);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
    await page.screenshot({path:info.outputPath("g132-superadmin-policy-mobile.png"),fullPage:true});
  });

  test("College Admin direct API PUT cannot bypass the read-only policy page", async ({page,context}) => {
    await authenticateGracefulRole(context,"college");
    await page.goto("/college/attendance/settings");
    await expect(page.getByText("These attendance policy fields are read-only for College Admin.")).toBeVisible();
    const status = await page.evaluate(async (collegeId) => {
      const response = await fetch("/api/attendance/admin/policy",{
        method:"PUT",credentials:"same-origin",headers:{"content-type":"application/json"},
        body:JSON.stringify({collegeId,eligibilityThresholdPercent:99,correctionWindowHours:1}),
      });
      return response.status;
    },SEED_IDS.collegeA);
    expect([401,403],"Only a Super Admin may change attendance policy").toContain(status);
  });
});
