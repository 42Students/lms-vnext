import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {accreditationOfferStatusLabel,accreditationJoiningLabel,accreditationPackageLpa} from "../../src/modules/placements/tpo-accreditation-students-model";
import {TPO_REPORT_GALLERY_GROUPS,tpoReportGalleryGroupSchema} from "../../src/modules/placements/tpo-report-gallery-filter-model";
const source=(name:string)=>readFileSync(join(process.cwd(),name),"utf8");
describe("Legacy reports display and privacy parity",()=>{
 it("TPO-calendar-reports-R02 formats offer status, joining and annual CTC exactly for the accreditation table and CSV",()=>{
  expect(accreditationOfferStatusLabel("ACCEPTED")).toBe("Accepted");
  expect(accreditationOfferStatusLabel("ISSUED")).toBe("Released");
  expect(accreditationJoiningLabel(null)).toBe("Not recorded");
  expect(accreditationJoiningLabel("DID_NOT_JOIN")).toBe("Did not join");
  expect(accreditationPackageLpa(1200000)).toBe("12 LPA");
  expect(accreditationPackageLpa(null)).toBe("Not recorded");
 });
 it("TPO-calendar-reports-R06 never puts an internal Membership ID into the generic unplaced CSV",()=>{
  const api=source("src/app/api/placements/reports/route.ts");
  const section=api.slice(api.indexOf("function unplacedCsv("),api.indexOf("function offersAcceptanceCsv("));
  expect(section).toContain('["Student", "Branch"]');
  expect(section).not.toMatch(/Membership ID|learner\.membershipId/);
 });
 it("TPO-calendar-reports-37 restores the three legacy report groups and Start here marker",()=>{
  expect(TPO_REPORT_GALLERY_GROUPS).toEqual(["ALL","Overview and performance",
   "Offers, joining and readiness gaps","Recruiter funnel and accreditation"]);
  expect(tpoReportGalleryGroupSchema.safeParse("Offers, joining and readiness gaps").success).toBe(true);
  const page=source("src/app/(authenticated)/tpo/reports/page.tsx");
  expect(page).toContain("Start here");
  expect(page).toContain("Start with the college-wide picture");
 });
});