import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=(name:string)=>readFileSync(name,"utf8");

describe("Original TPO Drive > Students screenshot and live screening semantics",()=>{
 it("renders compact selected-student review on existing authorized drive pipeline",()=>{
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx");
  expect(page).toContain("getTpoApplicantPipeline(context,filters.data)");
  expect(page).toContain("<TpoDriveStudentsPrototypeReview rows={data.rows}");
  expect(page).toContain("jobStatus={data.job.status}");
  expect(page).toContain("totalMatching={data.totalMatching} counts={data.counts}");
  expect(page).toContain("<TpoApplicationsSpreadsheet rows={data.rows}");
  expect(page).toContain("<TpoBulkActionPanel");
 });
 it("never substitutes a different applicant or guesses skill/resume facts",()=>{
  const view=source("src/components/tpo/tpo-drive-students-prototype-review.tsx");
  expect(view).toContain("selectedId===null?filtered[0]??null:filtered.find(row=>row.id===selectedId)??null");
  expect(view).toContain("bucketOf(row,jobStatus)");
  expect(view).toContain('aria-label="Drive applicant queue"');
  expect(view).toContain('aria-label="Selected applicant review"');
  expect(view).toContain('data-testid="tpo.drive.students.prototype-review"');
  expect(view).toContain("Not available in this view");
  expect(view).toContain("Skill matches, project details and resume recency are not verified");
  expect(view).not.toContain("Aarav Reddy");
  expect(view).not.toContain("286 eligible");
  expect(view).not.toContain("3 of 4");
 });
 it("reuses persisted optimistic-version screened decisions and opens real applicant evidence",()=>{
  const view=source("src/components/tpo/tpo-drive-students-prototype-review.tsx");
  const form=source("src/components/placements/tpo-applicant-review-form.tsx");
  expect(view).toContain("applicantDrawerReviewable(jobStatus,focused)");
  expect(view).toContain("<TpoApplicantReviewForm key={focused.id+");
  expect(view).toContain("expectedUpdatedAt={focused.screeningUpdatedAt}");
  expect(view).toContain("open the authorized full application");
  expect(view).toContain('href={root+"/applicants/"+encodeURIComponent(focused.id)}');
  expect(view).toContain("Skip to next");
  expect(form).toContain("expectedUpdatedAt,decision,note:note.trim()");
  expect(form).toContain('I reviewed the applicant and the learner-visible reason.');
  expect(form).toContain('Only pending or held submitted applicants can be reviewed.');
  expect(form).toContain('method:"POST"');
 });
 it("keeps page-only counts explicitly distinct from complete drive counts",()=>{
  const view=source("src/components/tpo/tpo-drive-students-prototype-review.tsx");
  expect(view).toContain("Counts here are page-scoped; complete stage totals are above.");
  expect(view).toContain("{counts.all} applications");
  expect(view).toContain("{counts.shortlisted} shortlisted");
  expect(view).toContain("Registered, not applied");
  expect(view).toContain('href={root+"/applications-export"}');
 });
});
