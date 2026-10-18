import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {hrDriveDraftFormStateKey,hrDriveSessionStorageKey} from "@/modules/placements/hr-unsent-draft-storage-model";

const recruiter="11111111-1111-4111-8111-111111111111";
const collegeA="22222222-2222-4222-8222-222222222222";
const collegeB="33333333-3333-4333-8333-333333333333";
const requestA="44444444-4444-4444-8444-444444444444";
const requestB="55555555-5555-4555-8555-555555555555";
describe("HR-BREAK-DRIVE-DRAFT-SCOPE-38: recruiter form state must not bleed between colleges and modes",()=>{
 it("changes the form instance on tenant, principal, source or action switch",()=>{
  const original=hrDriveDraftFormStateKey(recruiter,collegeA,"NEW",null);
  expect(hrDriveDraftFormStateKey(recruiter,collegeB,"NEW",null)).not.toBe(original);
  expect(hrDriveDraftFormStateKey(collegeB,collegeA,"NEW",null)).not.toBe(original);
  expect(hrDriveDraftFormStateKey(recruiter,collegeA,"COPY",requestA)).not.toBe(original);
  expect(hrDriveDraftFormStateKey(recruiter,collegeA,"EDIT",requestA)).not.toBe(original);
  expect(hrDriveDraftFormStateKey(recruiter,collegeA,"FIX",requestA)).not.toBe(original);
  expect(hrDriveDraftFormStateKey(recruiter,collegeA,"COPY",requestB))
   .not.toBe(hrDriveDraftFormStateKey(recruiter,collegeA,"COPY",requestA));
 });
 it("retains the same instance only for the identical authorized editing scope",()=>{
  const a=hrDriveDraftFormStateKey(recruiter,collegeA,"FIX",requestA);
  const b=hrDriveDraftFormStateKey(recruiter,collegeA,"FIX",requestA);
  expect(a).toBe(b);
 });
 it("keeps copied request local drafts separate from an unrelated new request",()=>{
  const scratch=hrDriveSessionStorageKey(recruiter,collegeA,null);
  const copy=hrDriveSessionStorageKey(recruiter,collegeA,requestA);
  expect(copy).not.toBe(scratch);
  expect(copy).not.toBe(hrDriveSessionStorageKey(recruiter,collegeA,requestB));
 });
 it("wires keyed editor and per-copy local draft namespace in the real HR new-drive page",()=>{
  const page=readFileSync("src/app/(authenticated)/hr/drives/new/page.tsx","utf8");
  expect(page).toContain("key={hrDriveDraftFormStateKey(context.user.id,collegeId,");
  expect(page).toContain('query.fix?"FIX":query.edit?"EDIT":query.copy?"COPY":query.from?"FROM":"NEW"');
  expect(page).toContain("requestId??query.from??null");
  expect(page).toContain("hrDriveSessionStorageKey(context.user.id,collegeId,query.copy??fromJob?.job.id)");
  expect(page).toContain("fixRequestId={query.copy?null:request?.id??null}");
 });
});
