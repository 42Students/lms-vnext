import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=(path:string)=>readFileSync(path,"utf8");
describe("TPO batch finished access and honest state",()=>{
 it("TPO-batches-48 enforces finished batch read-only on every decision entry point",()=>{
  const students=source("src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx");
  const learnerWrite=source("src/modules/placements/tpo-participation-service.ts");
  const groupWrite=source("src/modules/placements/batch-participation-service.ts");
  const cohortWrite=source("src/app/api/placements/tpo/batches/[batchId]/decisions/route.ts");
  expect(students).toContain("const finished=Boolean(batchScope.lifecycle?.finishedAt)");
  expect(students).toContain("!finished&&!s.ambiguous");
  expect(students).toContain("Eligibility decisions and import actions are read-only.");
  expect(learnerWrite).toContain("if (batchLifecycle?.finishedAt) throw new TpoParticipationConflictError()");
  expect(groupWrite).toContain('throw new PlacementBatchError("DB08_BATCH_FINISHED")');
  expect(cohortWrite).toContain('if(lifecycle?.finishedAt)');
  const rules=source("src/app/(authenticated)/tpo/batches/[batchId]/rules/page.tsx");
  expect(rules).toContain("ready&&!lifecycle?.finishedAt?<TpoBatchDecisionControl");
  expect(rules).toContain("This batch is finished. Eligibility decisions are read-only.");
 });
 it("TPO-batches-15 never renders internal lifecycle migration jargon",()=>{
  for(const path of ["src/app/(authenticated)/tpo/batches/page.tsx",
     "src/app/(authenticated)/tpo/batches/[batchId]/page.tsx",
     "src/app/(authenticated)/tpo/batches/[batchId]/rules/page.tsx"]){
   const ui=source(path);
   expect(ui).not.toContain("migration is pending");
   expect(ui).not.toContain("Lifecycle pending");
   expect(ui).not.toContain("DB08");
  }
  const ui=source("src/app/(authenticated)/tpo/batches/[batchId]/page.tsx");
  expect(ui).toContain("Status unavailable");
 });
 it("TPO-drive-workspace-74 derives recruiter cards from scoped data rather than a mismatched legacy key",()=>{
  const ui=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/about/page.tsx");
  expect(ui).toContain("data.recruiterContacts");
  expect(ui).toContain("No current recruiter email is recorded for this company relationship.");
  expect(ui).not.toContain("summary.recruiter");
 });
});
