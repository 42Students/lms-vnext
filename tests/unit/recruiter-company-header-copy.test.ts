import {describe,expect,it} from "vitest";
import {RECRUITER_COMPANY_EYEBROW,RECRUITER_PROFILE_LINK_LABEL,recruiterCompanySubtitle} from "@/modules/placements/hr-company-header-copy-model";
describe("REC-calendar-messages-profile-36 company heading exact legacy words",()=>{
 it("matches the role and profile button",()=>{
  expect(RECRUITER_COMPANY_EYEBROW).toBe("Recruiter");
  expect(RECRUITER_PROFILE_LINK_LABEL).toBe("Your profile");
 });
 it("uses the chosen college, not an unrelated company",()=>{
  expect(recruiterCompanySubtitle("Example College")).toBe("Your work with Example College");
 });
});
