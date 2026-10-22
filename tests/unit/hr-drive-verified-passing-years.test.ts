import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {hrDriveDraftSchema,emptyHrDriveDraft} from "@/modules/placements/hr-drive-draft-model";

describe("Recruiter draft multi-year eligibility",()=>{
 it("supports multiple authorized years and legacy single-year editing without widening",()=>{
  const base=emptyHrDriveDraft();
  expect(hrDriveDraftSchema.safeParse({...base,passingYear:"2027"}).success).toBe(true);
  expect(hrDriveDraftSchema.safeParse({...base,passingYear:"",passingYears:[2025,2027,2030]}).success).toBe(true);
  expect(hrDriveDraftSchema.safeParse({...base,passingYear:"2026",passingYears:[2027,2030]}).success).toBe(false);
  expect(hrDriveDraftSchema.safeParse({...base,passingYear:"",passingYears:[2027,2027]}).success).toBe(false);
 });
 it("shows keyboard-sized add/remove year controls and a continuously visible preview",()=>{
  const src=readFileSync("src/components/hr/hr-drive-draft-form.tsx","utf8");
  expect(src).toContain('aria-label="Selected passing years"');
  expect(src).toContain('aria-label={"Remove passing year "+year}');
  expect(src).toContain('passingYears:[...chosen,year].sort');
  expect(src).toContain('passingYears: "passingYears"');
  expect(src).toContain('aria-label="Drive preview and submit"');
  expect(src).toContain('lg:sticky lg:top-6');
 });
 it("preserves explicit applicant filters while canonicalizing the legacy first Assessment visit",()=>{
  const src=readFileSync("src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx","utf8");
  expect(src).toContain('Object.keys(rawQuery).every(key => key === "returnTo")');
  expect(src).toContain('redirect(resetHref + "?stage=ASSESSMENT"');
  expect(src).toContain("driveApplicationsParams(rawQuery)");
 });
});
