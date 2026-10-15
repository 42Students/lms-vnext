import {expect,it} from "vitest";
import {publicApplicantSearchSchema,escapeLiteralApplicantSearch,companyShareApplicantHref} from "@/modules/placements/company-share/public-filter-model";
it("bounds search, preserves URL state and neutralizes SQL wildcards",()=>{
 expect(publicApplicantSearchSchema.safeParse("x".repeat(81)).success).toBe(false);
 expect(escapeLiteralApplicantSearch("Ann%_")).toBe("Ann\\%\\_");
 expect(companyShareApplicantHref("token",2,"Ann%")).toContain("q=Ann%25");
 expect(companyShareApplicantHref("token",2,"Ann%")).toContain("page=2");
});
