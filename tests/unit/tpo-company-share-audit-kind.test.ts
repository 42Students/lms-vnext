import {expect,it} from "vitest";
import {tpoCompanyAuditKindSchema,tpoCompanyAuditHref,tpoCompanyAuditExportHref} from "@/modules/placements/company-share/audit-kind-model";
it("limits audit filtering and preserves it in page and scoped CSV links",()=>{
 expect(tpoCompanyAuditKindSchema.safeParse("CSV").success).toBe(true);
 expect(tpoCompanyAuditKindSchema.safeParse("IP").success).toBe(false);
 expect(tpoCompanyAuditHref("job","VIEW")).toContain("kind=VIEW");
 expect(tpoCompanyAuditExportHref("job","CSV")).toContain("kind=CSV");
});
