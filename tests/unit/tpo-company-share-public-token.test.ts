import {expect,it} from "vitest";
import {companyShareTokenSchema} from "@/modules/placements/company-share/token-model";
it("rejects malformed public tokens",()=>{
 for(const token of ["","abc","..","../admin","a".repeat(44)])
  expect(companyShareTokenSchema.safeParse(token).success).toBe(false);
});
