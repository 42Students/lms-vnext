import {expect,it} from "vitest";
import {companyShareEmptyMessage,shouldDisplayNewCompanyShare} from "@/modules/placements/company-share/status-model";
it("keeps creation and empty-state messages consistent with selected lifecycle filter",()=>{
 expect(shouldDisplayNewCompanyShare("EXPIRED")).toBe(false);
 expect(shouldDisplayNewCompanyShare("REVOKED")).toBe(false);
 expect(shouldDisplayNewCompanyShare("ACTIVE")).toBe(true);
 expect(companyShareEmptyMessage("REVOKED")).toContain("No revoked links");
});
