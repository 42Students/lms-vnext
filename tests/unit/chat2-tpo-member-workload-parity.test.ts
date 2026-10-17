import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {sortTpoPeople} from "@/modules/placements/tpo-team-people-sort-model";
const src=(path:string)=>readFileSync(path,"utf8");

const members=[
 {membershipId:"a",displayName:"Asha",studentDuties:[],openAsks:1,overdueAsks:0,
  liveDrives:0,draftDrives:0,companies:0,overdueFollowups:0,waitingOnOthers:0},
 {membershipId:"b",displayName:"Bela",studentDuties:[],openAsks:0,overdueAsks:0,
  liveDrives:2,draftDrives:1,companies:2,overdueFollowups:1,waitingOnOthers:3},
 {membershipId:"c",displayName:"Charu",studentDuties:[],openAsks:0,overdueAsks:2,
  liveDrives:0,draftDrives:0,companies:0,overdueFollowups:0,waitingOnOthers:0},
];
describe("TPO Team People persisted workloads",()=>{
 it("TPO-inbox-team-31 shows real drive, company, overdue follow-up and waiting-on-teammate numbers",()=>{
  const service=src("src/modules/placements/tpo-team-ownership-workload-service.ts");
  const page=src("src/app/(authenticated)/tpo/team/page.tsx");
  expect(service).toContain('assertPersistedPlatformPermission(tx,context,"placements.manage"');
  expect(service).toContain("eq(placementJobs.collegeId,college.id)");
  expect(service).toContain("eq(placementCompanyRelationships.collegeId,college.id)");
  expect(service).toContain("eq(placementTpoFollowups.collegeId,college.id)");
  expect(service).toContain('eq(placementTpoTeamAsks.status,"OPEN")');
  expect(page).toContain("readTpoTeamOwnershipWorkload(context)");
  for(const label of ["Live drives","Draft drives","Companies","Overdue follow-ups","Waiting on teammates"])
    expect(page).toContain(label);
  expect(page).toContain('!ownerWorkload.drivesReady?"Unavailable":count');
 });
 it("TPO-inbox-team-32 sorts real work before name, and overdue workload first",()=>{
  expect(sortTpoPeople(members,"WORK").map(member=>member.membershipId)).toEqual(["b","a","c"]);
  expect(sortTpoPeople(members,"OVERDUE").map(member=>member.membershipId)).toEqual(["c","b","a"]);
  expect(sortTpoPeople(members,"NAME").map(member=>member.membershipId)).toEqual(["a","b","c"]);
 });
});