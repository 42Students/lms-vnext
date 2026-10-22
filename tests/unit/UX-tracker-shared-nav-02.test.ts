import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("UX-tracker-shared-nav-02",()=>{
 it("announces the active page and supports focus/touch navigation without changing tracker wording",()=>{
  const nav=source("src/components/tracker/tracker-admin-nav.tsx");
  expect(nav).toContain("usePathname()");
  for(const destination of ["/tracker/issues","/tracker","/tracker/logs","/tracker/audit-findings"])
   expect(nav).toContain(`href: "${destination}"`);
  for(const label of ["Issues","Report Issue","Logs","Audit findings","Skip to content"])
   expect(nav).toContain(label);
  expect(nav).toContain('value={pathname.startsWith("/tracker/issues")');
  expect(nav).toContain('<Tabs renderPanel={false} ariaLabel="42 Tracker"');
  expect(nav).toContain("pathname.startsWith");
  expect(nav).toContain("min-h-11");
  expect(nav).toContain("focus-visible:outline-2");
  const toggle=source("src/components/tracker/tracker-theme-toggle.tsx");
  expect(toggle).toContain("aria-pressed");
  expect(toggle).toContain("min-h-11");
 });
});
