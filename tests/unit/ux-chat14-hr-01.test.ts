import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("chat-14 HR UX rollout batch 01",()=>{
 it("UX-hr-hr-activity-01 retains recruiter UX and safe markup contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/activity/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
 });
 it("UX-hr-hr-calendar-01 retains recruiter UX and safe markup contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/calendar/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
 });
 it("UX-hr-hr-colleges-01 retains recruiter UX and safe markup contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/colleges/page.tsx","utf8");
  expect(src).toContain("redirect(");
 });
 it("UX-hr-hr-company-01 retains recruiter UX and safe markup contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/company/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
 });
 it("UX-hr-hr-company-reports-01 retains recruiter UX and safe markup contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/company/reports/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
  expect(src).toContain("<HrCompanyReportsGrid");
  const grid=readFileSync("src/components/hr/hr-company-reports-grid.tsx","utf8");
  expect(grid).toContain("<TpoGrid");
  expect(src).toContain("Hiring activity by drive");
  expect(src).toContain("scopeKey={[context.user.id,collegeId].join");
  expect(src).toContain('aria-label="Company reports pagination"');
 });
 it("UX-hr-hr-conversations-01 retains recruiter UX and safe markup contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/conversations/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
  expect(src).not.toContain("<main");
 });
 it("UX-hr-hr-conversations-threadId-01 retains recruiter UX and safe markup contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
  expect(src).not.toContain("<main");
 });
 it("UX-hr-hr-drives-01 retains recruiter UX and safe markup contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/drives/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
 });
 it("UX-hr-hr-drives-jobId-interview-slots-01 retains recruiter UX and safe markup contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("<main");
 });
 it("UX-hr-hr-drives-jobId-messages-01 retains recruiter UX and safe markup contracts",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/drives/[jobId]/messages/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("<main");
 });
});
