import "server-only";
import {eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeSigninPolicies} from "@/db/schema/college-signin";
import {collegeSignInMethodSchema,legacyCollegeSignInMethodSchema,normalizeCollegeSignInMethod,signInCapabilities} from "./signin-methods-model";

/** No tenant selection from the request body: caller supplies the college
 * already resolved from the verified host. Missing row defaults to both. */
export async function effectiveCollegeSignInMethod(collegeId:string|null){
 if(!collegeId)return "EMAIL_AND_PHONE" as const;
 const db=getDb();
 const result=await db.execute(sql<{present:boolean}>`select to_regclass('public.college_signin_policies') is not null as present`);
 if(!result.rows[0]?.present)return "EMAIL_AND_PHONE" as const;
 const [row]=await db.select({method:collegeSigninPolicies.method}).from(collegeSigninPolicies)
  .where(eq(collegeSigninPolicies.collegeId,collegeId)).limit(1);
 if(!row)return "EMAIL_AND_PHONE" as const;
 // Decode legacy EMAIL_PHONE/PHONE_EMAIL without changing the effective
 // ordering or enabling a channel disabled by the persisted tenant policy.
 const current=collegeSignInMethodSchema.safeParse(row.method);
 if(current.success)return current.data;
 const legacy=legacyCollegeSignInMethodSchema.parse(row.method);
 return normalizeCollegeSignInMethod(legacy);
}
export async function effectiveCollegeSignInCapabilities(collegeId:string|null){
 return signInCapabilities(await effectiveCollegeSignInMethod(collegeId));
}
