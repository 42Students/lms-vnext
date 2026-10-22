import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("G2-14-025-034/061 recruiter selection TPO handoff",()=>{
 const writer=readFileSync("src/modules/placements/recruiter-selection-list-write-service.ts","utf8");
 const notifier=readFileSync("src/modules/placements/hr-tpo-notification-service.ts","utf8");
 it("persists candidate proposals and transactional TPO handoff exactly once",()=>{
  expect(writer).toContain('status:"SENT_FOR_VERIFICATION"');
  expect(writer).toContain('status:"PROPOSED"');
  expect(writer).toContain("action:\"SELECTION_LIST_SUBMITTED\",kind:input.kind,count:input.applicationIds.length");
  expect(writer).toContain("return {id:existing.id,status:existing.status,submitted:false}");
  expect(writer).not.toContain("await tx.insert(activityEvents).values(");
 });
 it("reuses the existing recruiter selection audit taxonomy with TPO notices",()=>{
  expect(notifier).toContain('SELECTION_LIST_SUBMITTED:{eventType:"placements.recruiter.selection_list_submitted"');
  expect(notifier).toContain('input.action==="SELECTION_LIST_SUBMITTED"?"recruiter_selection_list":"placement_job"');
  expect(notifier).toContain("await tx.insert(inAppNotifications).values(");
  expect(notifier).toContain('eq(collegeMemberships.status,"ACTIVE")');
 });
});
