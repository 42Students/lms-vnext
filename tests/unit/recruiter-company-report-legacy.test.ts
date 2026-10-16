import {describe,expect,it} from "vitest";
import {recruiterCompanyReportLegacyFields,reportLegacyValue} from "@/modules/placements/recruiter-company-report-legacy-model";
describe("REC-calendar-messages-profile-35 legacy hiring report columns",()=>{
 it("preserves five legacy columns and totals all offer decisions",()=>{
  const fields=recruiterCompanyReportLegacyFields({
   applications:15,outstandingOffers:2,acceptedOffers:3,declinedOffers:1,joinedOffers:2,
  });
  expect(fields).toEqual([
   ["Applied",15],["Offered",6],["Accepted",3],["Declined",1],["Joined",2],
  ]);
 });
 it("renders missing information Unavailable, not fabricated zero",()=>{
  expect(reportLegacyValue(null)).toBe("Unavailable");
  expect(reportLegacyValue(Number.NaN)).toBe("Unavailable");
  expect(reportLegacyValue(0)).toBe("0");
 });
});
