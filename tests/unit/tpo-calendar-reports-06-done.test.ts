import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
describe("TPO-calendar-reports-06 complete follow-up from calendar",()=>{
 it("exposes Done alongside Reschedule only for open TPO follow-ups",()=>{
  const page=readFileSync("src/components/placements/placement-calendar-workspace.tsx","utf8");
  const actions=readFileSync("src/components/placements/tpo-calendar-followup-actions.tsx","utf8");
  expect(page).toMatch(/event\.kind === "FOLLOW_UP" &&\s+event\.status === "OPEN"/);
  expect(page).toContain("<TpoCalendarMoveFollowup");
  expect(actions).toContain("/complete");
  expect(actions).toContain("Done");
  expect(actions).toContain('tpoCalendarFollowupSuccess("DONE")');
 });
 it("uses same-origin, actor-college scope and CRM writer, not client-submitted collegeId",()=>{
  const api=readFileSync("src/app/api/placements/tpo/calendar/follow-ups/[followupId]/done/route.ts","utf8");
  expect(api).toContain("isSameOriginRequest(request)");
  expect(api).toContain('hasMembershipRole(context,"TPO")');
  expect(api).toContain("const collegeId=context.membership.collegeId");
  expect(api).toContain("requirePlacementManageScope(context,collegeId)");
  expect(api).toContain("finishTpoFollowup(context,collegeId,id)");
 });
});
