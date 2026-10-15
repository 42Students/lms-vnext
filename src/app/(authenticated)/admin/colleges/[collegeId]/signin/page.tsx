import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {CollegeServiceError} from "@/modules/colleges/service";
import {readAdminCollegeSignInPolicy} from "@/modules/colleges/admin-signin-policy-service";

export default async function CollegeSignInMethods({params}:{params:Promise<{collegeId:string}>}){
 const {collegeId}=await params;
 const context=await getCurrentRequestContext();
 let result:Awaited<ReturnType<typeof readAdminCollegeSignInPolicy>>;
 try {result=await readAdminCollegeSignInPolicy(context,collegeId);}
 catch(error){if(error instanceof CollegeServiceError&&error.code==="COLLEGE_NOT_FOUND")notFound();throw error;}
 const {college,policy}=result;
 return <div className="min-w-0 space-y-6">
  <Link href={`/admin/colleges/${encodeURIComponent(college.id)}`} className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">← College setup</Link>
  <PageHeader eyebrow="Super Admin · College sign-in" title={college.name}
   description="Inspect the stored sign-in preference for this college. Changes to credential acceptance require a separately reviewed authentication rollout."/>
  <section className="rounded-xl border border-border bg-surface p-5">
   <h2 className="text-base font-semibold">Sign-in method</h2>
   {policy.kind==="CONFIGURED"?<p className="mt-2 break-words text-sm text-body">{policy.method.replaceAll("_"," ").toLowerCase()}</p>:
    <p role="status" className="mt-2 text-sm text-body">{policy.kind==="MIGRATION_PENDING"?
     "Sign-in method storage has not been migrated. No method is inferred from defaults.":
     policy.kind==="NOT_CONFIGURED"?"No college-specific sign-in method is stored.": "Stored method does not match the approved four-option contract."}</p>}
   <p className="mt-4 text-xs text-muted-foreground">Read-only: email/phone sign-in, identity linking, login fallbacks and credential enforcement are not modified from this page.</p>
  </section>
 </div>;
}
