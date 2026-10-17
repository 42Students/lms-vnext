import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("learner drive fact parity",()=>{
 it("LEARNER-placements-16 preserves published facts and application stage on role cards",()=>{
  const cards=source("src/components/placements/learner-placement-jobs.tsx");
  expect(cards).toContain("postedAtLabel(item.job.publishedAt)");
  expect(cards).toContain("Posted date not specified");
  expect(cards).toContain('className="mt-2 line-clamp-3');
  expect(cards).toContain("item.application.status");
  expect(cards).toContain("Not disclosed");
  expect(cards).toContain("learnerDriveDeadlineUrgency(");
 });
 it("LEARNER-placements-25 restores persisted drive detail facts and sections",()=>{
  const detail=source("src/components/placements/learner-placement-job-detail.tsx");
  const mapping=source("src/app/(authenticated)/learn/my-placements/jobs/[jobId]/page.tsx");
  for(const field of ["Where","Job type","Compensation","Pay","Posted","Applications close","Requirements &amp; preferences","Key dates"])
   expect(detail).toContain(field);
  expect(mapping).toContain("publishedAt: row.job.publishedAt?.toISOString()");
  expect(detail).toContain("LearnerSaveDriveButton");
  expect(detail).toContain("Number.isFinite(Date.parse(item.job.publishedAt))");
 });
});
