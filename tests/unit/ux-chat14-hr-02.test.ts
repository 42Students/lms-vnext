import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("chat-14 HR UX rollout batch 02",()=>{
 it("UX-hr-hr-drives-jobId-rounds-editor-01 guards recruiter responsive page source",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("<main");
 });
 it("UX-hr-hr-drives-jobId-rounds-editor-remove-roundId-01 guards recruiter responsive page source",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-3xl");
  expect(src).not.toContain("<main");
 });
 it("UX-hr-hr-drives-new-01 guards recruiter responsive page source",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/drives/new/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
 });
 it("UX-hr-hr-drives-proposals-01 guards recruiter responsive page source",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/drives/proposals/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("<main");
 });
 it("UX-hr-hr-drives-recorded-outside-01 guards recruiter responsive page source",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/drives/recorded-outside/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("<main");
 });
 it("UX-hr-hr-home-01 guards recruiter responsive page source",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/home/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).not.toContain("min-h-10");
 });
 it("UX-hr-hr-messages-01 guards recruiter responsive page source",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/messages/page.tsx","utf8");
  expect(src).toContain("export {default}");
 });
 it("UX-hr-hr-notifications-01 guards recruiter responsive page source",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/notifications/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
 });
 it("UX-hr-hr-placements-01 guards recruiter responsive page source",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/placements/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
 });
 it("UX-hr-hr-placements-jobs-jobId-01 guards recruiter responsive page source",()=>{
  const src=readFileSync("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx","utf8");
  expect(src).toContain("min-w-0 max-w-full");
  expect(src).toContain("<HrJobSelectionGrid");
  expect(src).toContain("<HrJobOffersGrid");
  const selectionGrid=readFileSync("src/components/hr/hr-job-selection-grid.tsx","utf8");
  const offerGrid=readFileSync("src/components/hr/hr-job-offers-grid.tsx","utf8");
  expect(selectionGrid).toContain('<DataTable');
  expect(offerGrid).toContain('<DataTable');
  const table=readFileSync("src/components/ui/data-table.tsx","utf8");
  const cue=readFileSync("src/components/ui/scroll-cue.tsx","utf8");
  expect(table).toContain('<ScrollCue axis="x"');
  expect(cue).toContain("overflow-x-auto overscroll-x-contain");
  expect(cue).toContain('tabIndex={edges.scrollable ? 0 : -1}');
 });
});
