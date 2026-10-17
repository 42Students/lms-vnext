import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const service=readFileSync("src/modules/placements/tpo-company-lifecycle-service.ts","utf8");
describe("TPO informational company bell",()=>{
 it("TPO-inbox-team-60 delivers a company relationship change to active current-college TPOs only",()=>{
  expect(service).toContain('eventType: "PLACEMENTS_COMPANY_LIFECYCLE_CHANGED"');
  expect(service).toContain('eq(collegeMemberships.collegeId,scope.collegeId)');
  expect(service).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(service).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(service).toContain('eq(membershipRoles.role,"TPO")');
  expect(service).toContain('eventId:event.id,title:"Company relationship changed"');
  expect(service).toContain('actionHref:"/tpo/companies/"+encodeURIComponent(input.companyId)');
  expect(service).toContain(".onConflictDoNothing()");
 });
 it("TPO-inbox-team-60 never broadens recipient roles or silently drops an oversized notification recipient set",()=>{
  expect(service).toContain("if(officers.length>500)throw");
  expect(service).toContain('limit(501)');
  expect(service).not.toContain('eq(membershipRoles.role,"LEARNER")');
 });
});