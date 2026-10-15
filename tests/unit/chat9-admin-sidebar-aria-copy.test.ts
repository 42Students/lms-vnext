import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
describe("College and Super Admin exact legacy navigation accessibility copy",()=>{
 it("uses the dev-legacy Main navigation accessible name for desktop and mobile",()=>{
  const nav=readFileSync(join(process.cwd(),"src/components/shell/sidebar-nav.tsx"),"utf8");
  expect(nav).toContain('aria-label="Main navigation"');
  expect(nav).not.toContain('aria-label="Primary navigation"');
  const mobile=readFileSync(join(process.cwd(),"src/components/shell/mobile-navigation.tsx"),"utf8");
  expect(mobile).toContain("<SidebarNav");
 });
});
