import { expect, test, type Page } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

const routes = [
  ["UX-G098", "Back to TPO home", "/tpo/home"],
  ["UX-G099", "Back to batches", "/tpo/batches"],
  ["UX-G100", "Back to TPO home", "/tpo/home"],
  ["UX-G101", "Back to calendar", "/tpo/calendar"],
  ["UX-G102", "Back to companies", "/tpo/companies"],
  ["UX-G104", "Back to TPO home", "/tpo/home"],
  ["UX-G105", "Back to placements", "/tpo/placements"],
  ["UX-G106", "Back to placements", "/tpo/placements"],
  ["UX-G107", "Back to placements", "/tpo/placements"],
  ["UX-G108", "Back to placements", "/tpo/placements"],
] as const;
const dimensions = [
  {name:"desktop",width:1280,height:800},
  {name:"mobile",width:390,height:844},
] as const;
async function noHorizontalOverflow(page:Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth+1)).toBe(true);
}
test.describe("TPO ten route fallbacks — actual components, keyboard and responsive layouts",()=>{
  for (const size of dimensions) {
    for (const [group,label,href] of routes) {
      test(group+" "+size.name+" retry, safe exit and private-message suppression",async({page},info)=>{
        test.setTimeout(90_000);
        await page.setViewportSize(size);
        const runtimeErrors:string[]=[];
        page.on("pageerror",e=>runtimeErrors.push(e.message));
        await page.goto("/e2e/ux-tpo-ten-recovery?group="+group);
        const section=page.getByRole("region",{name:group+" recovery"});
        await expect(section.getByRole("heading",{name:group+" recovery acceptance"})).toBeVisible();
        const exit=section.getByRole("link",{name:label});
        await expect(exit).toHaveAttribute("href",href);
        const retry=section.getByRole("button",{name:/Retry/});
        await expect(retry).toBeVisible();
        await retry.click();
        await expect(section.getByRole("status")).toContainText("Retry count: 1");
        await exit.focus(); await expect(exit).toBeFocused();
        await expect(page.locator("body")).not.toContainText("fixture-private-tenant-token");
        await noHorizontalOverflow(page);
        await page.screenshot({path:info.outputPath(group+"-"+size.name+".png"),fullPage:true});
        expect(runtimeErrors).toEqual([]);
      });
    }
  }
});

test.describe("TPO role denial on actual server pages",()=>{
  test.skip(process.env.E2E_AUTH_ENABLED!=="true"||!process.env.E2E_AUTH_SECRET,"Needs seeded PostgreSQL17 and temporary identities");
  for(const size of dimensions) {
    test(size.name+" learner cannot open the TPO company, batch or placement management pages",async({page,context},info)=>{
      test.setTimeout(90_000);
      await authenticateGracefulRole(context,"learner");
      await page.setViewportSize(size);
      for (const path of ["/tpo/companies","/tpo/batches","/tpo/placements"]) {
        await page.goto(path,{waitUntil:"domcontentloaded"});
        await expect(page).toHaveURL(/\/(?:dashboard(?:[?#]|$)|learn\/courses\?access=denied(?:&|$))/);
        await expect(page.getByRole("button",{name:/create drive|save placement|archive company/i})).toHaveCount(0);
        await noHorizontalOverflow(page);
      }
      await page.screenshot({path:info.outputPath("role-denial-"+size.name+".png"),fullPage:true});
    });
  }
});
