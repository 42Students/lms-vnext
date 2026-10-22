import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("COL-people-13 directory information without fabricated private data",()=>{
 it("COL-people-13 counts role membership metrics in the request college, not the filtered page",()=>{
  const db=source("src/modules/people/college-role-directory-service.ts");
  expect(db).toContain("const [roleMetrics]");
  expect(db).toContain("eq(collegeMemberships.collegeId,collegeId)");
  expect(db).toContain("eq(membershipRoles.role,kind)");
  expect(db).toContain("count(distinct");
  expect(db).toContain("status} = 'SUSPENDED'");
  expect(db).toContain("metrics:roleMetrics");
 });
 it("COL-people-13 renders Active/Suspended while refusing to invent online presence",()=>{
  const page=source("src/components/college/college-role-directory-workspace.tsx");
  expect(page).toContain('["Active",result.metrics.active]');
  expect(page).toContain('["Suspended",result.metrics.suspended]');
  expect(page).toContain("Visible now");
  expect(page).toContain("not online presence.");
  expect(page).toContain("View contact card");
 });
});
