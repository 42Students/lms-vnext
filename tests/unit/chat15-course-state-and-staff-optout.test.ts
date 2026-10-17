import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {learnerStaffApplicationOptOut} from "@/modules/placements/learner-staff-application-optout-model";
const src=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat15 learner recoverability and staff applications",()=>{
 it("LEARNER-course-detail-19 preserves lessons when assessment state fails and supports retry",()=>{
  const service=src("src/modules/courses/learner-course-service.ts");
  expect(service).toContain('stateWarnings.push("assignment completion")');
  expect(service).toContain('stateWarnings.push("quiz list")');
  expect(service).toContain('stateWarnings.push("quiz attempts")');
  const ui=src("src/components/courses/learner-course-workspace.tsx");
  expect(ui).toContain("Some course state could not be loaded");
  expect(ui).toContain("Retry state");
  expect(src("src/app/(authenticated)/learn/courses/error.tsx")).toContain("Could not load course lessons");
 });
 it("LEARNER-placements-30 derives staff origin from verified submittedByUserId and shows 48 hour deadline",()=>{
  expect(src("src/modules/placements/learner-journey-service.ts"))
    .toContain('channel: optOut.staffApplied?"PLACEMENT_CELL":row.application.channel');
  const ui=src("src/components/placements/learner-placement-journey.tsx");
  expect(ui).toContain("The placement cell applied for you");
  expect(ui).toContain("item.staffOptOutUntil");
  expect(ui).toContain("Opt out or ask to withdraw");
 });
 it("LEARNER-placements-30 checks 48h opt-out against locked persisted application",()=>{
  const submittedAt=new Date("2099-05-01T00:00:00Z");
  const fixture={submittedAt,submittedByUserId:"staff",learnerUserId:"learner"};
  expect(learnerStaffApplicationOptOut({...fixture,now:new Date("2099-05-02T23:59:59Z")}).canOptOut).toBe(true);
  expect(learnerStaffApplicationOptOut({...fixture,now:new Date("2099-05-03T00:00:00Z")}).canOptOut).toBe(false);
  expect(learnerStaffApplicationOptOut({...fixture,submittedByUserId:"learner",now:new Date("2099-05-01T01:00:00Z")}).staffApplied).toBe(false);
  const server=src("src/modules/placements/application-service.ts");
  expect(server).toContain("learnerStaffApplicationOptOut({");
  expect(server).toContain("optOut.staffApplied&&!optOut.canOptOut");
  expect(server).toContain('.for("update").limit(1)');
 });
});
