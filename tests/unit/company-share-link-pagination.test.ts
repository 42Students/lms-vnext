import {expect,it} from "vitest";
import {companyShareLinkPageSchema,companyShareLinksHref,COMPANY_SHARE_PAGE_SIZE} from "@/modules/placements/company-share/link-page-model";
it("validates link pages and preserves independent applicant/link URL state",()=>{
 expect(COMPANY_SHARE_PAGE_SIZE).toBe(25);
 expect(companyShareLinkPageSchema.safeParse(-1).success).toBe(false);
 const url=companyShareLinksHref("job","REVOKED",3,"Alice",2);
 expect(url).toContain("sharePage=3");
 expect(url).toContain("page=2");
 expect(url).toContain("shareStatus=REVOKED");
 expect(url).toContain("q=Alice");
});
