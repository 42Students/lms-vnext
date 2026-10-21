import {z} from "zod";
export const collegeSignInMethodSchema=z.enum(["EMAIL_AND_PHONE","PHONE_AND_EMAIL","EMAIL_ONLY","PHONE_ONLY"]);
/** Decode legacy persisted values, but keep one canonical vNext enum at rest. */
export const legacyCollegeSignInMethodSchema=z.enum(["EMAIL_PHONE","PHONE_EMAIL"]);
export function normalizeCollegeSignInMethod(method:
 z.infer<typeof collegeSignInMethodSchema>|z.infer<typeof legacyCollegeSignInMethodSchema>):
 z.infer<typeof collegeSignInMethodSchema>{
 return method==="EMAIL_PHONE"?"EMAIL_AND_PHONE":
  method==="PHONE_EMAIL"?"PHONE_AND_EMAIL":method;
}
export const updateCollegeSignInSchema=z.strictObject({
 collegeId:z.uuid(),
 method:z.union([collegeSignInMethodSchema,legacyCollegeSignInMethodSchema])
  .transform(normalizeCollegeSignInMethod),
 expectedVersion:z.number().int().nonnegative(),
});
export function signInCapabilities(method:z.infer<typeof collegeSignInMethodSchema>) {
 return {email:method!=="PHONE_ONLY",phone:method!=="EMAIL_ONLY",
 primary:method==="PHONE_ONLY"?"PHONE":method==="EMAIL_ONLY"?"EMAIL":method==="PHONE_AND_EMAIL"?"PHONE":"EMAIL"} as const;
}
