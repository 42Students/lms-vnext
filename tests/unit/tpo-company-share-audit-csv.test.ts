import {expect,it} from "vitest";
import {tpoCompanyShareAuditCsv} from "@/modules/placements/company-share/audit-csv-model";
it("exports only non-secret audit fields with explicit truncation",()=>{
 const csv=tpoCompanyShareAuditCsv([{sharePrefix:"=TEST",kind:"Page view",at:"2026-10-15T12:00:00Z"}],true);
 expect(csv).toContain("NOTICE");
 expect(csv).toContain("'=TEST");
 expect(csv).not.toContain("Token hash");
 expect(csv).not.toContain("Visitor IP");
});
