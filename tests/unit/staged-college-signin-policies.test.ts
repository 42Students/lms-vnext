import {describe,it,expect} from "vitest";
import {getTableName} from "drizzle-orm";
import {collegeSignInPoliciesStaged} from "@/modules/colleges/staged-schema";
import {collegeSignInMethodSchema} from "@/modules/colleges/signin-methods-model";
describe("staged college login policy",()=>{
 it("defines the owner's separate, unregistered table",()=>{
 expect(getTableName(collegeSignInPoliciesStaged)).toBe("college_signin_policies");
 expect(collegeSignInMethodSchema.options).toEqual(["EMAIL_AND_PHONE","PHONE_AND_EMAIL","EMAIL_ONLY","PHONE_ONLY"]);
 });
});
