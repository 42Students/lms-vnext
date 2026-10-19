import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import { requirePermission } from "@/modules/permissions/policy";
import {PageHeader} from "@/components/ui/page-header";
import {CollegeServiceError} from "@/modules/colleges/service";
import {readAdminCollegeSignInPolicy} from "@/modules/colleges/admin-signin-policy-service";
import {CollegeSigninMethodForm} from "@/components/admin/college-signin-method-form";
import {collegeIdSchema} from "@/modules/colleges/validation";

export default async function CollegeSignInMethods({params}:{params:Promise<{collegeId:string}>}){
  const context=await getCurrentRequestContext();
  requirePermission(context,"admin-scope.select");
 const {collegeId}=await params;
 if(!collegeIdSchema.safeParse(collegeId).success)notFound();

 let result:Awaited<ReturnType<typeof readAdminCollegeSignInPolicy>>;
 try {result=await readAdminCollegeSignInPolicy(context,collegeId);}
 catch(error){if(error instanceof CollegeServiceError&&error.code==="COLLEGE_NOT_FOUND")notFound();throw error;}
 const {college,policy}=result;
 return <div className="min-w-0 space-y-6">
  <Link href={`/admin/colleges/${encodeURIComponent(college.id)}`} className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] px-3 text-sm font-semibold text-primary-text hover:bg-[var(--lms-primary-subtle)]">← College setup</Link>
  <PageHeader eyebrow="Super Admin · College sign-in" title={college.name}
   description="Choose the one-time-code channels offered on this college web address."/>
  {policy.kind==="INVALID_POLICY"?<p role="alert" className="text-error">Stored sign-in method is invalid. Please contact an administrator.</p>:null}
  <CollegeSigninMethodForm collegeId={college.id}
   method={policy.kind==="CONFIGURED"?policy.method:"EMAIL_AND_PHONE"}
   version={result.version??0}
   ready={policy.kind!=="MIGRATION_PENDING"&&policy.kind!=="INVALID_POLICY"}/>
  <p className="text-xs text-muted-foreground">Changes apply to new college-host code requests. Existing sessions are not revoked.</p>
 </div>;
}
