import {describe,expect,it} from "vitest";
import {publicJoinUnavailableCopy} from "@/modules/placements/public-join/readiness-state";
describe("TPO-campaigns-public-R05 visible configuration gate",()=>{
 it("fails visibly with safe actionable description",()=>{
  for(const code of ["PROXY_UNVERIFIED","OTP_NOT_CONFIGURED","RATE_TABLE_MISSING"] as const)
   expect(publicJoinUnavailableCopy(code)).toContain("temporarily unavailable");
 });
});
