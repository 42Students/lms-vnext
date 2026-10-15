import {describe,expect,it} from "vitest";
import {readFileSync,existsSync} from "node:fs";
import {join} from "node:path";
describe("College placement Analytics links department readiness",()=>{
 it("exposes the scoped report even when Analytics filters are invalid",()=>{
  const root=join(process.cwd(),"src/app/(authenticated)/college");
  const src=readFileSync(join(root,"hiring-dashboard/page.tsx"),"utf8");
  const link='href="/college/placements/readiness-by-department"';
  expect(src.split(link).length-1).toBe(2);
  expect(src).toContain("Placement Evidence by Department");
  expect(existsSync(join(root,"placements/readiness-by-department/page.tsx"))).toBe(true);
 });
});
