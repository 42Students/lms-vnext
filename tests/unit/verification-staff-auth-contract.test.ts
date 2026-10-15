import {describe,it,expect} from "vitest";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
describe("verification staged table guard",()=>{it("fails with explicit unavailable state",()=>{
 const error=new VerificationUnavailableError();
 expect(error.message).toBe("VERIFICATION_TABLES_NOT_INSTALLED");
});});
