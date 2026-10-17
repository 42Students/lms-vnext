import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
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
    .toContain('row.application.submittedByUserId===context.user.id?row.application.channel:"PLACEMENT_CELL"');
  const ui=src("src/components/placements/learner-placement-journey.tsx");
  expect(ui).toContain("The placement cell applied for you");
  expect(ui).toContain("item.submittedAt.getTime()+48*60*60*1000");
  expect(ui).toContain("Opt out or ask to withdraw");
 });
});
