import {z} from "zod";
export const collegeSignInMethodSchema=z.enum(["EMAIL_AND_PHONE","PHONE_AND_EMAIL","EMAIL_ONLY","PHONE_ONLY"]);
export const updateCollegeSignInSchema=z.strictObject({collegeId:z.uuid(),method:collegeSignInMethodSchema,expectedVersion:z.number().int().nonnegative()});
export function signInCapabilities(method:z.infer<typeof collegeSignInMethodSchema>) {
 return {email:method!=="PHONE_ONLY",phone:method!=="EMAIL_ONLY",
 primary:method==="PHONE_ONLY"?"PHONE":method==="EMAIL_ONLY"?"EMAIL":method==="PHONE_AND_EMAIL"?"PHONE":"EMAIL"} as const;
}
