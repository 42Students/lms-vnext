import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat15 learner vendor assessments",()=>{
 it("LEARNER-placements-41 separates submission deadline from results release and gates it on registered column",()=>{
  const schema=source("src/db/schema/placements.ts");
  expect(schema).toContain('assessmentDueAt: timestamp("assessment_due_at"');
  const reader=source("src/modules/placements/request-service.ts");
  expect(reader).toContain("learnerPlacementRoundDeadlineAvailable()");
  expect(reader).toContain("assessmentDueAt:deadlineAvailable?placementJobRounds.assessmentDueAt");
  const schedule=source("src/app/(authenticated)/learn/my-placements/schedule/page.tsx");
  expect(schedule).toContain('row.roundKind==="VENDOR_TEST"');
  expect(schedule).toContain("Take it by {fmt(row.assessmentDueAt)}");
  const proposal=source("docs/proposed-migrations/learner-vendor-assessment-deadline.sql");
  expect(proposal).toContain("ADD COLUMN IF NOT EXISTS assessment_due_at timestamptz");
  expect(proposal).not.toContain("results_due_at =");
 });
});
