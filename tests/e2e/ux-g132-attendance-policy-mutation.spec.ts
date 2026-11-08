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
    // Super Admin's supported editor is /admin/attendance; the college-only
    // route deliberately redirects platform actors through role middleware.
    await page.goto("/admin/attendance");
    await expect(page.getByRole("heading",{level:2,name:"Attendance policy"})).toBeVisible();

    const threshold = page.locator("#attendance-policy-threshold");
    const hours = page.locator("#attendance-policy-hours");
    const thresholdActions = threshold.locator("..");
    const saveThreshold = thresholdActions.getByRole("button",{name:"Save",exact:true});
    const original = await threshold.inputValue();
    const previousHours = await hours.inputValue();
    const next = original === "80" ? "81" : "80";

    await threshold.fill("0");
    await expect(saveThreshold).toBeDisabled();
    await threshold.fill(next);
    await expect(saveThreshold).toBeEnabled();
    await saveThreshold.click();
    const review = page.getByRole("alertdialog",{name:"Save attendance setting for this college?"});
    await expect(review).toContainText("Minimum attendance: " + next + "%");
    await review.getByRole("button",{name:"Cancel"}).click();
    await expect(review).toHaveCount(0);

    await saveThreshold.click();
    const savedResponse = page.waitForResponse(r =>
      r.url().endsWith("/api/attendance/admin/policy") && r.request().method() === "PATCH");
    await page.getByRole("alertdialog",{name:"Save attendance setting for this college?"})
      .getByRole("button",{name:"Save setting"}).click();
    const saved = await savedResponse;
    expect(saved.status()).toBe(200);
    const savedPolicy = await saved.json() as {policy:{eligibilityThresholdPercent:number;correctionWindowHours:number}};
    expect(savedPolicy.policy.eligibilityThresholdPercent).toBe(Number(next));
    expect(savedPolicy.policy.correctionWindowHours).toBe(Number(previousHours));
    await page.screenshot({path:info.outputPath("g132-superadmin-policy-saved-desktop.png"),fullPage:true});

    // Verify the server refuses an authorized actor changing a different
    // college via direct API rather than trusting the selected UI scope.
    const crossTenantStatus = await page.evaluate(async (collegeId) => {
      const response = await fetch("/api/attendance/admin/policy",{
        method:"PATCH",credentials:"same-origin",headers:{"content-type":"application/json"},
        body:JSON.stringify({collegeId,field:"eligibilityThresholdPercent",
          expectedValue:75,value:60}),
      });
      return response.status;
    },SEED_IDS.collegeB);
    expect([401,403,404], "Super Admin scoped to college A must not mutate college B").toContain(crossTenantStatus);

    // Return the seeded policy to its original numeric value without changing
    // the second field or bypassing server-side compare-and-set protection.
    await threshold.fill(original);
    await saveThreshold.click();
    const restoredResponse = page.waitForResponse(r =>
      r.url().endsWith("/api/attendance/admin/policy") && r.request().method() === "PATCH");
    await page.getByRole("alertdialog",{name:"Save attendance setting for this college?"})
      .getByRole("button",{name:"Save setting"}).click();
    expect((await restoredResponse).status()).toBe(200);
    await page.setViewportSize({width:390,height:844});
    await page.goto("/admin/attendance");
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
