import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-4 TPO home revalidation",()=>{
 it("TPO-home-32 supplies company-scoped recruiter lead and drive actions plus follow-up",()=>{
  const layout=source("src/app/(authenticated)/tpo/layout.tsx");
  const menu=source("src/components/tpo/tpo-topbar-new-menu.tsx");
  // New actions moved to the global 68px topbar; an extra TPO bar would
  // duplicate the command strip and break the old LMS one-canvas shell.
  expect(layout).not.toContain("<TpoTopbarNewMenu");
  expect(layout).toContain("The global 68px topbar now owns Find, +New, Messages and Notifications.");
  expect(menu).toContain('pathname==="/tpo/companies"');
  expect(menu).toContain("New recruiter lead");
  expect(menu).toContain("New drive");
  expect(menu).toContain("encodeURIComponent(companyName)");
  expect(menu).toContain("<TpoNewFollowupModal");
 });
 it("TPO-home-R05 uses bounded next-week persisted calendar rounds and deadlines",()=>{
  const home=source("src/app/(authenticated)/tpo/home/page.tsx");
  const legacy=source("src/modules/placements/tpo-home-legacy-rows.ts");
  expect(home).toContain("getTime()+7*86400000");
  expect(home).toContain('event.kind==="ROUND"||event.kind==="APPLICATION_DEADLINE"');
  expect(home).toContain('event.companyName+" · "+event.title');
  expect(home).toContain("calendarAvailable:weekEvents!==null");
  expect(legacy).toContain("Today");
  expect(legacy).toContain("Tomorrow");
 });
});
