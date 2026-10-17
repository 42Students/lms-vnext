import {describe,it,expect} from "vitest";
import {legacyTpoReportCard,TPO_LEGACY_REPORT_COPY,TPO_LEGACY_REPORT_GALLERY_DESCRIPTION} from "../../src/modules/placements/tpo-legacy-report-copy";
describe("TPO Reports original copy",()=>{
 it("TPO-calendar-reports-36 uses exact card titles and descriptions for the eleven legacy reports",()=>{
  expect(Object.keys(TPO_LEGACY_REPORT_COPY)).toHaveLength(11);
  expect(legacyTpoReportCard({title:"CTC",description:"Current",path:"/tpo/reports/ctc"})).toMatchObject({
   title:"Packages",
   description:"Highest, median and average of each student's best offer, and how packages are spread. Internships are left out.",
  });
  expect(legacyTpoReportCard({title:"Leads report",description:"New",path:"/tpo/reports/leads"}).title).toBe("Recruiter engagement");
  expect(legacyTpoReportCard({title:"joining",description:"New",path:"/tpo/reports/joining-status"}).title).toBe("Joining status");
  expect(legacyTpoReportCard({title:"Unknown",description:"Extra",path:"/tpo/reports/intelligence"}).title).toBe("Unknown");
 });
 it("TPO-calendar-reports-38 uses the exact Reports gallery subtitle",()=>{
  expect(TPO_LEGACY_REPORT_GALLERY_DESCRIPTION).toBe("Answer placement questions quickly, then drill in and export the underlying data.");
 });
});
