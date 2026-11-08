import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

const enabled = process.env.E2E_AUTH_ENABLED === "true" && Boolean(process.env.E2E_AUTH_SECRET);

test.describe("UX-G154 and UX-G161 — persisted functional UX acceptance", () => {
  test.skip(!enabled, "Disposable seeded database and test-only role credentials required");

  test("G154: a permitted global Super Admin creates a real draft project template", async ({page,context}, info) => {
    test.setTimeout(120_000);
    await authenticateGracefulRole(context, "superadmin");
    await page.setViewportSize({width:1280,height:800});
    await page.goto("/admin/projects/templates/new");
    await expect(page.getByRole("heading",{level:1,name:"Create project template"})).toBeVisible();

    await page.getByRole("textbox",{name:"Template title"}).fill("E2E UX verified template");
    await page.getByRole("textbox",{name:"Slug"}).fill("ux-g154-verified-template-"+info.retry);
    await page.getByRole("textbox",{name:"First task"}).fill("Review the working project");
    await page.locator("details").filter({has:page.locator("summary",{hasText:"Overview and submission"})})
      .locator("summary").click();
    await page.getByRole("textbox",{name:"Deliverables (one per line)"})
      .fill("Responsive project workspace with documented acceptance.");

    const createResponse = page.waitForResponse(r =>
      r.url().endsWith("/api/projects/templates") && r.request().method()==="POST");
    await page.getByRole("button",{name:"Create draft template"}).click();
    const saved = await createResponse;
    expect(saved.status(), "A draft template must be persisted, not merely acknowledged").toBe(201);
    const result = await saved.json() as {template?:{id:string}};
    expect(result.template?.id).toMatch(/^[0-9a-f-]{36}$/i);
    await expect(page).toHaveURL(new RegExp("/admin/projects/templates/[0-9a-f-]{36}(?:/overview)?$","i"));
    await page.screenshot({path:info.outputPath("g154-draft-template-created-desktop.png"),fullPage:true});
    await page.setViewportSize({width:390,height:844});
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
    await page.screenshot({path:info.outputPath("g154-draft-template-created-mobile.png"),fullPage:true});
  });

  test("G161: signed-in Super Admin submits a report and opens the actual issue",async ({page,context},info) => {
    test.setTimeout(120_000);
    await authenticateGracefulRole(context,"superadmin");
    await page.setViewportSize({width:1280,height:800});
    await page.goto("/tracker");
    await expect(page.getByRole("heading",{level:1,name:"What went wrong?"})).toBeVisible();
    await expect(page.getByRole("button",{name:"Report issue",exact:true})).toBeVisible();

    await page.getByRole("textbox",{name:"Reporter"}).fill("Seed Superadmin");
    await page.getByLabel("Account used").selectOption("SUPER_ADMIN");
    await page.getByLabel("Environment").selectOption("DEVELOPMENT");
    // The native selects live inside nested Label components whose accessible\n    // names include the option labels. Scope by the named fieldset instead of\n    // waiting for a non-existent exact \"Page\" accessible name.\n    const locationFields = page.getByRole("group",{name:"Where did this happen?"}).locator("select");\n    await locationFields.nth(0).selectOption("Dashboard");\n    await locationFields.nth(1).selectOption("Overview");
    await page.getByLabel("What kind of issue?").selectOption("UI / Alignment");
    await page.getByLabel("What went wrong?").fill("E2E UX acceptance: navigation label did not fit at mobile width.");

    const receipt = page.waitForResponse(r =>
      r.url().endsWith("/api/tracker/issues") && r.request().method()==="POST");
    await page.getByRole("button",{name:"Report issue",exact:true}).click();
    const response = await receipt;
    expect(response.status(), "Report creation must commit to isolated DB").toBe(201);
    const result = await response.json() as {issue?:{publicId:string}};
    expect(result.issue?.publicId).toMatch(/^LMS-[0-9]+$/);
    await expect(page.getByRole("link",{name:"View issue"})).toBeVisible();
    await page.screenshot({path:info.outputPath("g161-report-created-desktop.png"),fullPage:true});
    await page.setViewportSize({width:390,height:844});
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(2);
    await page.getByRole("link",{name:"View issue"}).click();
    await expect(page).toHaveURL(new RegExp("/tracker/issues/"+result.issue!.publicId+"$"));
    await page.screenshot({path:info.outputPath("g161-report-detail-mobile.png"),fullPage:true});
  });

  test("G161: authenticated Learner is forbidden from privileged issue listing",async ({page,context}) => {
    await authenticateGracefulRole(context,"learner");
    await page.goto("/tracker");
    await expect(page.getByRole("heading",{level:1,name:"What went wrong?"})).toBeVisible();
    const response=await page.request.get("/api/tracker/live-logs");
    expect(response.status()).toBe(403);
    expect(response.headers()["content-type"]??"").not.toContain("text/csv");
  });
});
