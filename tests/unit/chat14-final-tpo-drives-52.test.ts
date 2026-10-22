import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("chat-14 final sprint",()=>{
 it("TPO-drives-52 quick and full routes share the canonical TPO create workspace",()=>{
  const quick=read("src/app/(authenticated)/tpo/placements/new/draft/page.tsx");
  const full=read("src/app/(authenticated)/tpo/placements/new/page.tsx");
  expect(quick).toContain("<PlacementJobCreateWorkspace");
  expect(full).toContain("<PlacementJobCreateWorkspace");
  expect(quick).toContain('basePath="/tpo/placements"');
 });
 it("TPO-drives-52 shared form autosaves drafts and keeps eligibility/publish confirmation",()=>{
  const src=read("src/components/placements/placement-job-create-form.tsx");
  expect(src).toContain('const backupKey="lms:drive-create:"');
  expect(src).toContain("localStorage.setItem(backupKey");
  expect(src).toContain("eligibilityPreset");
  expect(src).toContain('value="review-publish"');
  expect(src).toContain('"Save as draft"');
  expect(src).toContain("No students are notified until you confirm publication.");
  expect(src).toContain("applicationDeadline");
 });
});