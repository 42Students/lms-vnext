import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { authenticateGracefulRole, type GracefulRole } from "./support/roles";

const enabled = process.env.E2E_AUTH_ENABLED === "true" && Boolean(process.env.E2E_AUTH_SECRET);
const scenarios: readonly {
 group: string; role: GracefulRole; path: string; heading: RegExp;
}[] = [
 {group:"G132",role:"college",path:"/college/attendance/settings",heading:/Attendance policy/i},
 {group:"G154",role:"superadmin",path:"/admin/projects/templates/new",heading:/Create project template/i},
 {group:"G161",role:"superadmin",path:"/tracker",heading:/What went wrong\?/i},
 {group:"G178",role:"college",path:"/college/people/manage",heading:/(People|Directory|Manage)/i},
 // The protected teacher recovery destination renders the faculty prototype with an h1 of "Courses".\n {group:"G184",role:"faculty",path:"/teacher/courses",heading:/^Courses$/i},
];

test.describe("UX five-group batch — authenticated viewport smoke and screenshots",()=>{
 test.skip(!enabled,"Requires isolated E2E DB and seeded authenticated roles; never run against production.");
 for(const scenario of scenarios){
  for(const [viewport,width,height] of [["desktop",1280,800],["mobile",390,844]] as const){
   test(`${scenario.group} ${viewport} role surface is readable without document overflow`,async({page,context})=>{
    test.setTimeout(90_000);
    await authenticateGracefulRole(context,scenario.role);
    await page.setViewportSize({width,height});
    await page.goto(scenario.path);
    await expect(page.getByRole("heading",{level:1,name:scenario.heading}).first()).toBeVisible();
    const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-window.innerWidth));
    expect(overflow,`${scenario.group} ${viewport} document overflow`).toBeLessThanOrEqual(2);
    mkdirSync("test-results/ux-five-group", {recursive:true});
    await page.screenshot({path:`test-results/ux-five-group/${scenario.group}-${viewport}.png`,fullPage:true});
   });
  }
 }
 test("G178 learner cannot export the college people directory",async({page,context})=>{
  await authenticateGracefulRole(context,"learner");
  const response=await page.request.get("/api/college/people/export");
  expect([401,403]).toContain(response.status());
  expect(response.headers()["content-type"]??"").not.toContain("text/csv");
 });
});


test.describe("UX unfinished groups — role, form and step-up acceptance", () => {
  test.skip(!enabled, "Only run with disposable E2E database and seeded roles.");

  for (const size of [
    {name: "desktop", width: 1280, height: 800},
    {name: "mobile", width: 390, height: 844},
  ] as const) {
    test(`G132 ${size.name}: College Admin cannot mutate attendance policy`, async ({page,context}, info) => {
      await authenticateGracefulRole(context, "college");
      await page.setViewportSize(size);
      await page.goto("/college/attendance/settings");
      await expect(page.getByRole("heading", {name: "College attendance policy", exact: true})).toBeVisible();
      await expect(page.getByText("These attendance policy fields are read-only for College Admin.")).toBeVisible();
      await expect(page.getByRole("button", {name: /Save attendance policy|Reset to default/i})).toHaveCount(0);
      await expect(page.getByRole("button", {name: "Reload attendance policy"})).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(2);
      await page.screenshot({path: info.outputPath(`g132-policy-readonly-${size.name}.png`), fullPage: true});
    });

    test(`G154 ${size.name}: empty global template cannot create and edited draft requires discard confirmation`, async ({page,context}, info) => {
      await authenticateGracefulRole(context, "superadmin");
      await page.setViewportSize(size);
      await page.goto("/admin/projects/templates/new");
      await expect(page.getByRole("heading", {level: 1, name: "Create project template"})).toBeVisible();
      await page.getByRole("button", {name: "Create draft template"}).click();
      await expect(page.getByText("Title is required")).toBeVisible();
      await page.getByRole("textbox", {name: "Template title"}).fill("Unsaved example");
      await page.getByRole("button", {name: "Cancel", exact: true}).click();
      await expect(page.getByRole("alertdialog", {name: "Discard unsaved changes?"})).toBeVisible();
      await page.screenshot({path: info.outputPath(`g154-template-discard-${size.name}.png`), fullPage: true});
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(2);
    });
  }

  test("G154: learner cannot author a global project template", async ({page,context}) => {
    await authenticateGracefulRole(context, "learner");
    await page.goto("/admin/projects/templates/new", {waitUntil: "commit"});
    await expect(page.getByRole("button", {name: "Create draft template"})).toHaveCount(0);
  });

  test("G178: a seeded College Admin cannot export private People CSV without a fresh OTP device session", async ({page,context}) => {
    await authenticateGracefulRole(context, "college");
    await page.goto("/college/people/manage");
    await expect(page.getByRole("heading", {level: 1, name: /(People|Directory|Manage)/i})).toBeVisible();
    const response = await page.request.get("/api/college/people/export", {maxRedirects: 0});
    expect([401, 403], "E2E identity must never substitute for a recent OTP device session").toContain(response.status());
    expect(response.headers()["content-type"] ?? "").not.toContain("text/csv");
    expect(response.headers()["content-disposition"] ?? "").not.toContain("attachment");
  });

  test("G161: non-admin reporter cannot read privileged tracker issue exports", async ({page,context}) => {
    await authenticateGracefulRole(context, "learner");
    await page.goto("/tracker");
    await expect(page.getByRole("heading", {level: 1, name: /What went wrong/i})).toBeVisible();
    const response = await page.request.get("/api/tracker/live-logs", {maxRedirects: 0});
    expect(response.status()).toBe(403);
    expect(response.headers()["content-type"] ?? "").not.toContain("text/csv");
    expect(response.headers()["content-disposition"] ?? "").not.toContain("attachment");
  });

  test("G182: even a seeded Super Admin identity cannot bypass fresh-OTP export protection", async ({page,context}) => {
    await authenticateGracefulRole(context, "superadmin");
    await page.goto("/tracker");
    for (const path of [
      "/api/mentor/calendar/export",
      "/api/mentor/task-review-history/export",
      "/api/mentor/activity/export",
      "/api/mentor/reviews/export",
      "/api/projects/00000000-0000-4000-8000-000000000001/mentor-activity-export",
    ]) {
      const response = await page.request.get(path, {maxRedirects: 0});
      expect([401, 403, 302, 307, 308], `${path} must deny non-OTP E2E identity`).toContain(response.status());
      expect(response.headers()["content-type"] ?? "").not.toContain("text/csv");
      expect(response.headers()["content-disposition"] ?? "").not.toContain("attachment");
    }
  });
});
