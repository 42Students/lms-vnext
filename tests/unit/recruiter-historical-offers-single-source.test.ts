import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const file=(path:string)=>readFileSync(path,"utf8");
describe("Recruiter historical privacy and grant scope",()=>{
 it("shows only one previous-year offers and joining panel",()=>{
  const page=file("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx");
  expect(page).toContain('aria-label="Previous year company offers"');
  expect(page).toContain("getRecruiterHistoricalOffers");
  expect(page).not.toContain("getRecruiterPreviousHiringOffers");
  expect(page).not.toContain('aria-label="Previous hiring offers at this college"');
 });
 it("keeps all recruiter drive reads behind a finite future grant expiry",()=>{
  const list=file("src/modules/placements/recruiter-service.ts");
  const workspace=file("src/modules/placements/recruiter-workspace-service.ts");
  const booked=file("src/modules/placements/recruiter-booked-interviews-service.ts");
  const finite="gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`)";
  expect(list).toContain(finite);
  expect(workspace).toContain(finite);
  expect(booked).toContain(finite);
  expect(list).not.toContain("or(isNull(placementRecruiterCollegeGrants.validUntil)");
 });
});