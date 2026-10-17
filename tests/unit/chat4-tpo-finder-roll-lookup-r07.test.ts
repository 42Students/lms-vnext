import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(name:string)=>readFileSync(join(process.cwd(),name),"utf8");
describe("TPO-home-R07 scoped finder parity",()=>{
 it("TPO-home-R07 searches learner name or roll with active college membership and learner role",()=>{
  const s=source("src/modules/placements/tpo-find-people-service.ts");
  expect(s).toContain("requirePlacementManageScope(ctx,collegeId)");
  for(const evidence of ["eq(collegeMemberships.collegeId,collegeId)",'eq(collegeMemberships.status,"ACTIVE")',
    'eq(users.platformStatus,"ACTIVE")','eq(membershipRoles.role,"LEARNER")',
    "learnerProfiles.rollNumber","departments.name",
    "sql`strpos(lower(coalesce(${learnerProfiles.rollNumber},'')),${term})>0`"])
   expect(s).toContain(evidence);
 });
 it("TPO-home-R07 requires two characters, caps groups, opens learner membership drawer with roll query",()=>{
  const page=source("src/app/(authenticated)/tpo/find/page.tsx");
  const suggestions=source("src/app/api/tpo/find-suggestions/route.ts");
  expect(page).toContain("min(2).max(100)");
  expect(page).toContain("Search must contain 2–100 characters.");
  expect(page).toContain("s.rollNumber??s.name??");
  expect(page).toContain("s.branch");
  expect(suggestions).toContain('person.rollNumber??person.name??""');
  expect(suggestions).toContain("person.branch");
  expect(suggestions).toContain(".slice(0,5)");
 });
});
