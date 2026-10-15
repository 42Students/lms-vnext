import {expect,it} from "vitest";
import {companyShareStatusSchema,companyShareStatusLabel} from "@/modules/placements/company-share/status-model";
it("allows only known persisted link lifecycle statuses",()=>{
 expect(companyShareStatusSchema.safeParse("ACTIVE").success).toBe(true);
 expect(companyShareStatusSchema.safeParse("EXPIRED").success).toBe(true);
 expect(companyShareStatusSchema.safeParse("REVOKED").success).toBe(true);
 expect(companyShareStatusSchema.safeParse("HIDDEN").success).toBe(false);
 expect(companyShareStatusLabel("REVOKED")).toBe("Revoked");
});
