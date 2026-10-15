import {expect,it} from "vitest";
import {companyShareIssueFailureMessage} from "@/modules/placements/company-share/issue-message-model";
it("distinguishes safe active-link limit from generic failures",()=>{
 expect(companyShareIssueFailureMessage("ACTIVE_LINK_LIMIT")).toContain("10 active");
 expect(companyShareIssueFailureMessage("NOT_FOUND")).not.toContain("not found");
});
