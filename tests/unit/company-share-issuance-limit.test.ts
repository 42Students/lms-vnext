import {expect,it} from "vitest";
import {canIssueCompanyApplicantShare,MAX_ACTIVE_COMPANY_APPLICANT_SHARES} from "@/modules/placements/company-share/issue-policy";
it("limits concurrently active external capability count per job",()=>{
 expect(MAX_ACTIVE_COMPANY_APPLICANT_SHARES).toBe(10);
 expect(canIssueCompanyApplicantShare(9)).toBe(true);
 expect(canIssueCompanyApplicantShare(10)).toBe(false);
 expect(canIssueCompanyApplicantShare(-1)).toBe(false);
 expect(canIssueCompanyApplicantShare(0.5)).toBe(false);
});
