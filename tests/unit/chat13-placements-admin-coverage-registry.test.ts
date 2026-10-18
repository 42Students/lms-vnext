import {describe,expect,it} from "vitest";
import {existsSync,readFileSync,readdirSync} from "node:fs";

describe("SA-ADMIN-LEDGER-01 every dedicated placement-admin/report module has an explicit coverage record",()=>{
 it("enumerates every admin, Super Admin, report and platform-policy file without silently omitting new entrypoints",()=>{
  const ledger=readFileSync("docs/audit/coverage/placements-admin-chat13-ledger.md","utf8");
  const names=readdirSync("src/modules/placements").filter(name=>
    /^(?:admin-|super-admin-|report-|platform-placement-policy-)/.test(name) &&
    name.endsWith(".ts"));
  // The registered inventory currently has 39 files. New files must be
  // documented rather than silently reducing the audit surface.
  expect(names.length).toBeGreaterThanOrEqual(39);
  const missing=names.filter(name=>!ledger.includes(name));
  expect(missing).toEqual([]);
 });
 it("also keeps the 37 first-third /admin and Projects/Placements page audits linked",()=>{
  const content=readFileSync("docs/audit/coverage/chat13-superadmin-placements-projects-page-audit.md","utf8");
  const manifest=readFileSync("docs/orchestrator/ui-ux/pages-admin.md","utf8");
  const tests=readFileSync("tests/unit/chat13-admin-first-third-audit.test.ts","utf8");
  const breaker=readFileSync("tests/unit/PROJ-BREAK-SA-admin-pages-and-scope.test.ts","utf8");
  expect(content).toContain("all 48 current");
  expect(manifest).toContain("/admin/academics");
  expect(manifest).toContain("/admin/hr");
  const routes=[...manifest.matchAll(/^- \[ \] `([^`]+)` \((.+)\)$/gm)];
  expect(routes.length).toBeGreaterThanOrEqual(111);
  expect(routes[0]?.[1]).toBe("/admin/academics");
  expect(routes[36]?.[1]).toBe("/admin/hr");
  for(const entry of routes.slice(0,37))expect(existsSync(entry[2]!)).toBe(true);
  expect(tests).toContain("allRoutes.slice(0, 37)");
  expect(breaker).toContain("PROJ-BREAK-SA-15");
  expect(breaker).toContain("PROJ-BREAK-SA-16");
 });
});
