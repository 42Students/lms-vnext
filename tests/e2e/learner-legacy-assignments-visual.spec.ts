import { test, expect } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

test.describe("Legacy Learner All Assignments visual candidate", () => {
  test.skip(!process.env.E2E_AUTH_SECRET ||
    process.env.E2E_AUTH_ENABLED !== "true",
    "Requires disposable seeded Learner and development E2E harness");

  test("desktop assignments route renders a legacy list/empty state and captures screenshot",
    async ({page,context},testInfo) => {
      await authenticateGracefulRole(context,"learner");
      await page.setViewportSize({width:1280,height:800});
      const response=await page.goto("/learn/allAssignments",{
        waitUntil:"domcontentloaded",
      });
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading",{level:1,name:"All Assignments"})).toBeVisible();
      const list=page.getByRole("region",{name:"Assignment list"});
      const empty=page.getByRole("heading",{name:"No assignments yet"});
      // Empty illustration also owns the accessible Assignment list region;
      // require real article rows before asserting populated-only controls.
      const populated=(await list.locator("article").count())>0;
      const hasEmpty=await empty.isVisible().catch(()=>false);
      expect(populated||hasEmpty,"Real data must render assignments or the legacy empty state").toBe(true);
      await expect(page.locator("details").filter({
        has:page.locator("summary").getByText("More assignment filters"),
      })).toHaveCount(populated?1:0);
      const snapshot=await page.evaluate(async()=>{
        await document.fonts.ready;
        await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
        return {
          viewportWidth:innerWidth,
          documentWidth:document.documentElement.scrollWidth,
          height:document.documentElement.scrollHeight,
          assignmentRows:document.querySelectorAll("[aria-label='Assignment list'] article").length,
        };
      });
      expect(snapshot.documentWidth).toBeLessThanOrEqual(snapshot.viewportWidth+1);
      const file=testInfo.outputPath("learner-all-assignments-1280x800.png");
      const image=await page.screenshot({
        fullPage:false,animations:"disabled",caret:"hide",path:file,
      });
      await testInfo.attach("learner-all-assignments-desktop",{body:image,contentType:"image/png"});
      await testInfo.attach("assignment-layout-measurements",{
        body:Buffer.from(JSON.stringify(snapshot,null,2)),
        contentType:"application/json",
      });
    });

  test("advanced search and state filters remain keyboard accessible for populated pages",
    async ({page,context}) => {
      await authenticateGracefulRole(context,"learner");
      await page.goto("/learn/allAssignments");
      const details=page.locator("details").filter({
        has:page.locator("summary").getByText("More assignment filters"),
      });
      if(await details.count()===0){
        await expect(page.getByRole("heading",{name:"No assignments yet"})).toBeVisible();
        return;
      }
      await expect(details).not.toHaveAttribute("open");
      const summary=details.locator("summary");
      await summary.press("Enter");
      await expect(details).toHaveAttribute("open");
      await expect(page.getByText("Assignment quick views:")).toBeVisible();
      await expect(details.getByText("State · Sort")).toBeVisible();
      await summary.press("Enter");
      await expect(details).not.toHaveAttribute("open");
    });

  test("mobile All Assignments does not force horizontal scrolling",
    async ({page,context}) => {
      await authenticateGracefulRole(context,"learner");
      await page.setViewportSize({width:390,height:844});
      await page.goto("/learn/allAssignments");
      await expect(page.getByRole("heading",{level:1,name:"All Assignments"})).toBeVisible();
      const metrics=await page.evaluate(()=>({
        viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
      }));
      expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport+1);
    });
});
