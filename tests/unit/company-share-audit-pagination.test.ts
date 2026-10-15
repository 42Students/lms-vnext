import {expect,it} from "vitest";
import {companyShareAuditPageSchema,companyShareAuditPageHref,COMPANY_SHARE_AUDIT_EXPORT_LIMIT} from "@/modules/placements/company-share/audit-page-model";
it("bounds access-history pagination and preserves action filters",()=>{
 expect(COMPANY_SHARE_AUDIT_EXPORT_LIMIT).toBe(500);
 expect(companyShareAuditPageSchema.safeParse(-1).success).toBe(false);
 expect(companyShareAuditPageSchema.safeParse(3).success).toBe(true);
 expect(companyShareAuditPageHref("job","CSV",3)).toContain("kind=CSV&page=3");
});
