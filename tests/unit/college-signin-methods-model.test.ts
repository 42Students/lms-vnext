import {describe,it,expect} from "vitest";
import {collegeSignInMethodSchema,signInCapabilities,updateCollegeSignInSchema} from "@/modules/colleges/signin-methods-model";
describe("college sign in methods",()=>{
 it("retains the four legacy options",()=>{expect(collegeSignInMethodSchema.options).toHaveLength(4);expect(signInCapabilities("PHONE_AND_EMAIL").primary).toBe("PHONE");expect(signInCapabilities("EMAIL_ONLY").phone).toBe(false);});
 it("requires scoped optimistic concurrency",()=>{expect(updateCollegeSignInSchema.safeParse({collegeId:"invalid",method:"PHONE_ONLY"}).success).toBe(false);});
});
