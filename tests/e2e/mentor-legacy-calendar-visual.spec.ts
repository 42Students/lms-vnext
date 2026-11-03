import {test,expect,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME}
  from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const base="http://localhost:3000";
const secret=process.env.E2E_AUTH_SECRET;

/**
 * Executable old-LMS user-job checks; screenshots are optional debug evidence.
 * These are seeded, non-production Mentor fixtures; no external calendar,
 * SMS or email actions are executed.
 */
async function mentorSession(context:BrowserContext){
  if(!secret)throw new Error("E2E_AUTH_SECRET required for Mentor capture");
  await context.clearCookies();
  await context.addCookies([
    {name:E2E_IDENTITY_COOKIE_NAME,value:"seed-shared-faculty",
      url:base,httpOnly:true,sameSite:"Lax"},
    {name:E2E_SECRET_COOKIE_NAME,value:secret,
      url:base,httpOnly:true,sameSite:"Lax"},
    {name:"lms_membership",value:SEED_IDS.facultyCollegeAMembership,
      url:base,httpOnly:true,sameSite:"Lax"},
    {name:"lms_role",value:"MENTOR",
      url:base,httpOnly:true,sameSite:"Lax"},
  ]);
}

test.describe("Mentor meeting capability and UI-surface parity",()=>{
  test.skip(!secret,"Requires isolated seeded Mentor account");

  test("desktop: requested and completed meetings are visible and actionable",
    async({page,context},testInfo)=>{
      await mentorSession(context);
      await page.setViewportSize({width:1280,height:800});
      const response=await page.goto("/mentor/calendar",{waitUntil:"domcontentloaded"});
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading",{level:1,name:"Meetings"})).toBeVisible();
      await expect(page.getByRole("heading",{level:2,name:/^Upcoming \(\d+\)$/})).toBeVisible();
      await expect(page.getByRole("heading",{level:2,name:"Upcoming (1)"})).toBeVisible();
      await expect(page.getByRole("heading",{level:2,name:"Past & Cancelled (1)"})).toBeVisible();
      await expect(page.getByLabel("Upcoming meetings").getByText("87g",{exact:true})).toBeVisible();
      await expect(page.getByLabel("Past and cancelled meetings").getByText("Sprint 46 Review & Retrospective",{exact:true})).toBeVisible();
      const primary=page.getByLabel("Meetings list");
      await expect(primary).toBeVisible();
      const advanced=page.locator("details").filter({
        has:page.locator("summary").getByText("Meeting filters and calendar tools"),
      });
      await expect(advanced).not.toHaveAttribute("open");
      const observed=await page.evaluate(async()=>{
        await document.fonts.ready;
        await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
        return {
          viewportWidth:innerWidth,
          contentWidth:document.documentElement.scrollWidth,
          scrollHeight:document.documentElement.scrollHeight,
          rowCount:document.querySelectorAll("[aria-label='Meetings list'] article").length,
        };
      });
      expect(observed.rowCount).toBe(2);
      expect(observed.viewportWidth).toBe(1280);
      expect(observed.contentWidth).toBeLessThanOrEqual(1281);
      expect(observed.scrollHeight).toBeLessThan(20000);
      const png=await page.screenshot({
        fullPage:false,animations:"disabled",caret:"hide",
        path:testInfo.outputPath("mentor-calendar-1280x800-diagnostic.png"),
      });
      await testInfo.attach("mentor-calendar-diagnostic",{
        body:png,contentType:"image/png",
      });
      await testInfo.attach("mentor-calendar-overflow-metrics",{
        body:Buffer.from(JSON.stringify(observed,null,2)),contentType:"application/json",
      });
    });


  test("project deep link is discoverable and navigates in authorized Mentor scope",
    async({page,context})=>{
      await mentorSession(context);
      await page.goto("/mentor/calendar");
      const upcoming=page.getByLabel("Upcoming meetings");
      const past=page.getByLabel("Past and cancelled meetings");
      const requested=upcoming.getByText("87g",{exact:true});
      await expect(requested).toBeVisible();
      await expect(past.getByText("Sprint 46 Review & Retrospective",{exact:true})).toBeVisible();
      // REQUESTED and COMPLETED meetings have no active scheduled join action.
      await expect(upcoming.getByRole("link",{name:"Join link"})).toHaveCount(0);
      await expect(past.getByRole("link",{name:"Join link"})).toHaveCount(0);
      const link=upcoming.getByRole("link",{name:"Open project"});
      await expect(link).toBeVisible();
      const href=await link.getAttribute("href");
      expect(href).toMatch(/^\/mentor\/projects\/[^/?#]+\?tab=team$/);
      await link.click();
      await expect(page).toHaveURL(/\/mentor\/projects\/[^/?#]+\?tab=team/);
      await expect(page.locator("body")).not.toContainText("Access denied");
    });

  test("advanced calendar controls remain keyboard-accessible",async({page,context})=>{
    await mentorSession(context);
    await page.goto("/mentor/calendar");
    const details=page.locator("details").filter({
      has:page.locator("summary").getByText("Meeting filters and calendar tools"),
    });
    await expect(details).not.toHaveAttribute("open");
    const summary=details.locator(":scope > summary");
    await summary.focus();
    await summary.press("Enter");
    await expect(details).toHaveAttribute("open");
    await summary.press("Enter");
    await expect(details).not.toHaveAttribute("open");
    const scheduling=page.locator("details").filter({
      has:page.locator("summary").getByText("Scheduling and Google Calendar"),
    });
    await scheduling.locator("summary").click();
    await expect(scheduling).toHaveAttribute("open");
  });


  test("mentor outside India sees meeting times in the browser timezone",
    async({browser})=>{
      const localContext=await browser.newContext({
        viewport:{width:1280,height:800},
        timezoneId:"America/New_York",
      });
      try{
        await mentorSession(localContext);
        const page=await localContext.newPage();
        await page.goto("/mentor/calendar",{waitUntil:"domcontentloaded"});
        await expect(page.getByText(
          "Meeting times are shown in America/New_York."
        )).toBeVisible();
        // The Oct 24 requested meeting is stored as UTC 10:30, or 06:30 EDT.
        const requested=page.getByLabel("Upcoming meetings").locator("article").first();
        await expect(requested).toContainText("87g");
        await expect(requested).toContainText("06:30 AM");
        await expect(requested).toContainText("GMT-04:00");
      }finally{
        await localContext.close();
      }
    });

  test("mobile Mentor Meetings view has no whole-document horizontal overflow",
    async({page,context})=>{
      await mentorSession(context);
      await page.setViewportSize({width:390,height:844});
      await page.goto("/mentor/calendar");
      await expect(page.getByRole("heading",{level:2,name:/^Upcoming \(\d+\)$/})).toBeVisible();
      await expect(page.getByRole("heading",{level:2,name:/^Past & Cancelled \(\d+\)$/})).toBeVisible();
      const widths=await page.evaluate(()=>({
        viewport:innerWidth,content:document.documentElement.scrollWidth,
      }));
      expect(widths.content).toBeLessThanOrEqual(widths.viewport+1);
    });
});
