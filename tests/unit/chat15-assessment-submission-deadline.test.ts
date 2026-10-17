import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("learner vendor assessment deadline source of truth",()=>{
 it("LEARNER-placements-41 never presents a results deadline as a submission cutoff",()=>{
  const migration=source("drizzle/0135_lanes_round_3.sql");
  expect(migration).toContain("ADD COLUMN IF NOT EXISTS assessment_due_at timestamptz");
  expect(migration).toContain("CHECK (assessment_due_at IS NULL OR kind IN ('TEST','VENDOR_TEST'))");
  const schema=source("src/db/schema/placements.ts");
  expect(schema).toContain('assessmentDueAt: timestamp("assessment_due_at"');
  expect(schema).toContain('resultsDueAt: timestamp("results_due_at"');
  const service=source("src/modules/placements/request-service.ts");
  expect(service).toContain("learnerPlacementRoundDeadlineAvailable()");
  expect(service).toContain("assessmentDueAt:deadlineAvailable?");
  const page=source("src/app/(authenticated)/learn/my-placements/schedule/page.tsx");
  expect(page).toContain("row.assessmentDueAt");
  expect(page).toContain("Take it by");
  expect(page).not.toContain("row.resultsDueAt");
 });
 it("LEARNER-placements-37 and LEARNER-placements-41 expose safe test links with no inferred attempt or attendance",()=>{
  const page=source("src/app/(authenticated)/learn/my-placements/schedule/page.tsx");
  expect(page).toContain(String.raw`row.testUrl&&/^https:\/\//i.test(row.testUrl)`);
  expect(page).toContain("Take online assessment");
  expect(page).toContain('rel="noopener noreferrer"');
  expect(page).toContain("not an attendance confirmation or final outcome");
 });
});
