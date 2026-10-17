import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(file:string)=>readFileSync(new URL("../../"+file,import.meta.url),"utf8");

describe("chat-5 gap register OPEN/WRONG adjudication against current main",()=>{
 it("TPO-batches-12 keeps instant URL-synced, clearable and debounce-filter-preserving search rather than a submit-only form",()=>{
  const page=src("src/app/(authenticated)/tpo/batches/page.tsx");
  const control=src("src/components/tpo/tpo-batch-instant-search.tsx");
  expect(page).toContain("TpoBatchInstantSearch");
  expect(control).toContain("window.setTimeout(");
  expect(control).toContain("},250)");
  expect(control).toContain('new URLSearchParams(window.location.search)');
  expect(control).toContain('params.set("q",search)');
  expect(control).toContain('params.delete("q")');
  expect(control).toContain('params.delete("page")');
  expect(control).toContain("router.replace(");
  expect(control).toContain("aria-label=\"Clear batch search\"");
 });
 it("TPO-drives-03 is WRONG: CLOSED and CANCELLED jobs both appear in the Closed tab and its count, whereas recruiter request rejection is not a job status",()=>{
  const source=src("src/modules/placements/tpo-drive-lifecycle-list-service.ts");
  const schema=src("src/db/schema/placements.ts");
  const page=src("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  expect(source).toContain("inArray(placementJobs.status,[...TPO_CLOSED_JOB_STATUSES])");
  expect(source).toContain("sql<number>`count(*) filter(where ${inArray(placementJobs.status,[...TPO_CLOSED_JOB_STATUSES])})::int`");
  expect(page).toContain('["CLOSED","Closed",data.statusCounts.closed]');
  expect(schema).toContain("placement_jobs_status_ck");
  expect(schema).toContain("'DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED', 'CANCELLED'");
  expect(schema).not.toContain("placement_jobs_status_ck_INVALID_PLACEHOLDER");
 });
});
