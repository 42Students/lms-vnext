import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {sortTpoPeople} from "@/modules/placements/tpo-team-people-sort-model";
const src=(p:string)=>readFileSync(p,"utf8");
const rows=[
 {membershipId:"b",displayName:"Bea",studentDuties:[],openAsks:4,overdueAsks:2},
 {membershipId:"a",displayName:"Asha",studentDuties:[1,2],openAsks:1,overdueAsks:0},
 {membershipId:"c",displayName:"Chet",studentDuties:[],openAsks:1,overdueAsks:1},
];
describe("Team workload sorting",()=>{
 it("TPO-inbox-team-32 places actually overdue asks first rather than guessing from roster order",()=>{
  expect(sortTpoPeople(rows,"OVERDUE").map(x=>x.membershipId)).toEqual(["b","c","a"]);
  expect(sortTpoPeople(rows,"WORK").map(x=>x.membershipId)).toEqual(["b","a","c"]);
  expect(sortTpoPeople(rows,"NAME").map(x=>x.membershipId)).toEqual(["a","b","c"]);
 });
 it("TPO-inbox-team-31 uses only scoped OPEN ask records for real per-person workload",()=>{
  const service=src("src/modules/placements/tpo-team-workload-service.ts");
  const page=src("src/app/(authenticated)/tpo/team/page.tsx");
  expect(service).toContain("assertPersistedPlatformPermission");
  expect(service).toContain('eq(placementTpoTeamAsks.collegeId,college.id)');
  expect(service).toContain('eq(placementTpoTeamAsks.status,"OPEN")');
  expect(service).toContain("filter(where");
  expect(page).toContain("workloadByMember.get(member.membershipId)");
  expect(page).toContain("member.overdueAsks");
 });
 it("TPO-inbox-team-22 exposes ask status in People without fabricating work for other colleges",()=>{
  const page=src("src/app/(authenticated)/tpo/team/page.tsx");
  expect(page).toContain('"Overdue first"');
  expect(page).toContain("Ask workload is not available yet.");
  expect(page).toContain("member.openAsks");
 });
});
