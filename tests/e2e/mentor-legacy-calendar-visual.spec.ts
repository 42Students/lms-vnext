import {test,expect,type BrowserContext} from "@playwright/test";
import {E2E_IDENTITY_COOKIE_NAME,E2E_SECRET_COOKIE_NAME}
  from "../../src/auth/e2e-identity";
import {SEED_IDS} from "../../scripts/db-seed-data";

const base="http://localhost:3000";
const secret=process.env.E2E_AUTH_SECRET;

/**
 * A real application capture, not a screenshot update.
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

test.describe("Old LMS Mentor Meetings visual candidate",()=>{
  test.skip(!secret,"Requires isolated seeded Mentor account");

  test("1280x800 legacy meeting list renders without overflowing and captures proof",
    async({page,context},testInfo)=>{
      await mentorSession(context);
      await page.setViewportSize({width:1280,height:800});
      const response=await page.goto("/mentor/calendar",{waitUntil:"domcontentloaded"});
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading",{level:1,name:"Meetings"})).toBeVisible();
      await expect(page.getByRole("heading",{level:2,name:/^Upcoming \(\d+\)$/})).toBeVisible();
      await expect(page.getByRole("heading",{level:2,name:/^Past & Cancelled \(\d+\)$/})).toBeVisible();
      const primary=page.getByLabel("Meetings list");
      await expect(primary).toBeVisible();
      // Old reference was captured with the icon rail collapsed. Do not
      // measure the legitimate hover/focus-expanded 256px navigation state.
      await page.mouse.move(850,650);
      await page.evaluate(()=>{
        if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
      });
      await expect(page.locator('[data-slot="legacy-sidebar"]')).toHaveCSS("width","96px");
      const advanced=page.locator("details").filter({
        has:page.locator("summary").getByText("Meeting filters and calendar tools"),
      });
      await expect(advanced).not.toHaveAttribute("open");
      const observed=await page.evaluate(async()=>{
        await document.fonts.ready;
        await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
        const rect=document.documentElement.getBoundingClientRect();
        const box=(selector:string)=>{
          const element=document.querySelector(selector);
          if(!element)return null;
          const r=element.getBoundingClientRect();
          return {x:r.x,y:r.y,width:r.width,height:r.height};
        };
        return {
          viewportWidth:innerWidth,contentWidth:document.documentElement.scrollWidth,
          scrollHeight:document.documentElement.scrollHeight,
          documentWidth:rect.width,
          sidebar:box('[data-slot="legacy-sidebar"]'),
          topbar:box('header[aria-label="Application top bar"]'),
          canvas:box('[data-slot="page-canvas"]'),
          rowCount:document.querySelectorAll("[aria-label='Meetings list'] article").length,
        };
      });
      expect(observed.viewportWidth).toBe(1280);
      expect(observed.contentWidth).toBeLessThanOrEqual(1281);
      expect(observed.sidebar).not.toBeNull();
      expect(observed.topbar).not.toBeNull();
      expect(observed.canvas).not.toBeNull();
      expect(observed.sidebar!.width).toBeGreaterThanOrEqual(95);
      expect(observed.sidebar!.width).toBeLessThanOrEqual(97);
      expect(observed.topbar!.height).toBeGreaterThanOrEqual(84);
      expect(observed.topbar!.height).toBeLessThanOrEqual(86);
      expect(observed.canvas!.x).toBeGreaterThanOrEqual(118);
      expect(observed.canvas!.x).toBeLessThanOrEqual(122);
      expect(observed.canvas!.y).toBeGreaterThanOrEqual(99);
      expect(observed.canvas!.y).toBeLessThanOrEqual(104);

      expect(observed.scrollHeight).toBeLessThan(20000);
      const png=await page.screenshot({
        fullPage:false,animations:"disabled",caret:"hide",
        path:testInfo.outputPath("mentor-calendar-1280x800-candidate.png"),
      });
      await testInfo.attach("mentor-calendar-1280x800-candidate",{
        body:png,contentType:"image/png",
      });
      await testInfo.attach("mentor-calendar-measurements",{
        body:Buffer.from(JSON.stringify(observed,null,2)),contentType:"application/json",
      });
    });

  test("advanced calendar controls remain keyboard-accessible",async({page,context})=>{
    await mentorSession(context);
    await page.goto("/mentor/calendar");
    const details=page.locator("details").filter({
      has:page.locator("summary").getByText("Meeting filters and calendar tools"),
    });
    await expect(details).not.toHaveAttribute("open");
    const summary=details.locator("summary");
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
