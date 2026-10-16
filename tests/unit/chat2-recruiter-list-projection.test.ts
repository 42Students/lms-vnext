import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO-recruiters-01 and TPO-recruiters-02 roster columns",()=>{
 it("projects owner and activity dates in the scoped service",()=>{
  const s=readFileSync("src/modules/placements/tpo-crm-service.ts","utf8");
  expect(s).toContain("ownerName:row.ownerMembershipId");
  expect(s).toContain("lastActivityAt:");
  expect(s).toContain("nextFollowupAt:");
 });
 it("renders legacy roster headers",()=>{
  const s=readFileSync("src/components/tpo/recruiter-leads-workspace.tsx","utf8");
  for(const name of ["Status","Owner","Last activity","Next follow-up","Invite","Added"])
    expect(s).toContain('"'+name+'"');
 });
});
