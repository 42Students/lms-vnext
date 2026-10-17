import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=(file:string)=>readFileSync(file,"utf8");

describe("TPO Team unowned handover confirmation",()=>{
 it("TPO-inbox-team-33 shows an explicit confirm modal before assigning unowned work",()=>{
  const ui=source("src/components/tpo/tpo-team-assign-unowned.tsx");
  expect(ui).toContain("Nobody owns {drives} drives and {companies} companies");
  expect(ui).toContain('onClick={()=>setConfirmOpen(true)}');
  expect(ui).toContain("<ConfirmActionDialog open={confirmOpen&&!busy}");
  expect(ui).toContain('title="Assign unowned placement work?"');
  expect(ui).toContain("onCancel={()=>setConfirmOpen(false)}");
  expect(ui).toContain("onConfirm={()=>{setConfirmOpen(false);void assign();}}");
  expect(ui).toContain("if(pending.current||!assignee)return");
  expect(ui).toContain("Nothing has been assumed saved");
 });
 it("TPO-inbox-team-33 assigns only unowned active college work and records a recipient bell",()=>{
  const service=source("src/modules/placements/tpo-team-unowned-service.ts");
  const route=source("src/app/api/placements/tpo/team/unowned/route.ts");
  expect(service).toContain("assertPersistedPlatformPermission(tx,context");
  expect(service).toContain("isNull(placementJobs.ownerMembershipId)");
  expect(service).toContain("isNull(placementCompanyRelationships.ownerMembershipId)");
  expect(service).toContain('eq(collegeMemberships.collegeId,college.id)');
  expect(service).toContain("targetMembershipId:target.id");
  expect(service).toContain('title:"You now own placement work"');
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("tpoAssignUnownedSchema.safeParse");
 });
});
