import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=(file:string)=>readFileSync(file,"utf8");
describe("TPO Students / To verify prototype",()=>{
 it("keeps the full private review and optimistic version workflow while adding queue/detail presentation",()=>{
  const panel=source("src/components/verification/TpoVerificationPanel.tsx");
  expect(panel).toContain("<TpoVerificationPrototypeQueue rows={visible} active={active}");
  expect(panel).toContain('onReview={row=>{setSequenceIndex(null);setSelected(row);}}');
  expect(panel).toContain("VerificationReviewDrawer");
  expect(panel).toContain('apiBase="/api/tpo/verification"');
  expect(panel).toContain('Advanced verification table, sorting and filters');
  expect(panel).toContain("TpoRosterVerificationBulk");
  expect(panel).toContain("TpoStudentNudgePanel");
 });
 it("never treats student queue metadata as an uploaded document or verified academic record",()=>{
  const side=source("src/components/verification/TpoVerificationPrototypeQueue.tsx");
  expect(side).toContain("No documents are inferred from roster metadata.");
  expect(side).toContain("focus.marksheets.uploaded");
  expect(side).toContain("focus.marksheets.expected");
  expect(side).toContain("focus.attention.join");
  expect(side).toContain("Review documents");
  expect(side).toContain("actual uploaded evidence");
  expect(side).not.toContain("Bhavana Rao");
  expect(side).not.toContain("marksheet-10.pdf");
 });
 it("keeps the view on the server-authorized page with secure review actions",()=>{
  const panel=source("src/components/verification/TpoVerificationPanel.tsx");
  const side=source("src/components/verification/TpoVerificationPrototypeQueue.tsx");
  const page=source("src/app/(authenticated)/tpo/verification/page.tsx");
  expect(page).toContain("getTpoVerificationQueue(context,query)");
  expect(panel).toContain("filterTpoVerificationRows(rows,filters,asOf)");
  expect(side).toContain("rows.find(row=>row.learnerMembershipId");
  expect(side).toContain("row.learnerName");
  expect(side).toContain("focus.submittedAt");
  expect(side).toContain('timeZone:"Asia/Kolkata"');
 });
});
