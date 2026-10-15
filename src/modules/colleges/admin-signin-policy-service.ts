import "server-only";
import {eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {getSuperAdminTenantLifecycleDetail} from "@/modules/colleges/admin-tenant-lifecycle-service";
import {collegeSignInPoliciesStaged} from "./staged-schema";
import {signInPolicyReadState} from "./signin-policy-read-model";
/** Never changes authentication behavior; read-only staged policy display. */
export async function readAdminCollegeSignInPolicy(context:RequestContext,collegeId:unknown){
 const college=await getSuperAdminTenantLifecycleDetail(context,collegeId);
 requirePermission(context,"college.read",{organizationId:college.organizationId,collegeId:college.id});
 const db=getDb();
 const present=await db.execute(sql<{found:boolean}>`SELECT to_regclass('public.college_signin_policies') IS NOT NULL AS found`);
 if(present.rows[0]?.found!==true)return {college,policy:signInPolicyReadState(false,null)};
 const [row]=await db.select({
  method:collegeSignInPoliciesStaged.method,
  version:collegeSignInPoliciesStaged.version,
  updatedAt:collegeSignInPoliciesStaged.updatedAt,
 }).from(collegeSignInPoliciesStaged).where(eq(collegeSignInPoliciesStaged.collegeId,college.id)).limit(1);
 return {college,policy:signInPolicyReadState(true,row?.method??null),version:row?.version??null,updatedAt:row?.updatedAt??null};
}
