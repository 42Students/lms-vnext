import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("chat-4 College academic and people gap closure",()=>{
 it("COL-academic-setup-R03 links the required academic-period setup from guides and empty states",()=>{
  const tabs=source("src/modules/people/college-legacy-tabs-model.ts");
  const guide=source("src/modules/admin-ui/admin-dashboard-navigation.ts");
  const batches=source("src/components/academics/college-cohort-management.tsx");
  const classes=source("src/components/academics/college-section-management.tsx");
  expect(tabs).toContain('{label:"Academic periods",href:"/college/academics"}');
  expect(guide).toContain('key: "academic-periods", href: "/college/academics"');
  expect(guide.indexOf('key: "academic-periods"')).toBeLessThan(guide.indexOf('key: "batches"'));
  for(const content of [batches,classes]){
   expect(content).toContain('<Link href="/college/academics"');
   expect(content).toContain("Set up academic periods");
  }
  expect(source("src/app/(authenticated)/college/academics/page.tsx")).toContain("<AcademicsOverview");
 });
});
