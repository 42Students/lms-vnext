import {notFound} from "next/navigation";
import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {ErrorState} from "@/components/ui/error-state";
import {EmptyState} from "@/components/ui/empty-state";
import {PageBackLink} from "@/components/ui/page-back-link";
import {CollegeServiceError} from "@/modules/colleges/service";
import {readAdminCollegeSignInPolicy} from "@/modules/colleges/admin-signin-policy-service";
import {CollegeSigninMethodForm} from "@/components/admin/college-signin-method-form";
import {collegeIdSchema} from "@/modules/colleges/validation";

export default async function CollegeSignInMethods({params}:{params:Promise<{collegeId:string}>}){
  const context=await getCurrentRequestContext();
  requirePermission(context,"admin-scope.select");
 const {collegeId}=await params;
 if(!collegeIdSchema.safeParse(collegeId).success)return <div className="min-w-0 space-y-4">
  <PageHeader title="Sign-in methods" actions={<PageBackLink href="/admin/colleges" label="Colleges"/>}/>
  <EmptyState title="Choose a college" description="Select a college to manage its sign-in settings."
   action={<Link href="/admin/colleges" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Browse colleges</Link>}/>
 </div>;

 let result:Awaited<ReturnType<typeof readAdminCollegeSignInPolicy>>|null=null;
 try {result=await readAdminCollegeSignInPolicy(context,collegeId);}
 catch(error){
  if(error instanceof CollegeServiceError&&error.code==="COLLEGE_NOT_FOUND")notFound();
  if(error instanceof AuthorizationError)throw error;
 }
 if(!result)return <div className="min-w-0 space-y-[var(--lms-space-6)]">
   <PageHeader title="Sign-in methods"
     description="Manage code-based sign-in settings for the selected college."
     actions={<PageBackLink href="/admin/colleges" label="Colleges"/>}/>
   <Alert tone="error">Sign-in settings could not be loaded.</Alert>
   <ErrorState title="Couldn't load this college's sign-in settings."
     description="The current saved login policy could not be verified. Saving is disabled until the authorized settings are loaded."
     action={<Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/signin"}
       className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
       Reload
     </Link>}/>
 </div>;
 const {college,policy}=result;
 return <div className="min-w-0 space-y-[var(--lms-space-6)]">
  <PageHeader title={college.name}
   description="How everyone — students, staff and recruiters — signs in on this college\u0027s own web address."
   actions={<PageBackLink href={`/admin/colleges/${encodeURIComponent(college.id)}`} label="College setup"/>}/>
  <section aria-label="Sign-in" className="min-w-0 max-w-3xl space-y-[var(--lms-space-4)] rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <h2 className="text-base font-semibold text-[var(--lms-heading)]">Sign-in</h2>
   <Link href={"/admin/colleges/"+encodeURIComponent(college.id)+"/signin"}
    className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Reload</Link>
  </div>
  {policy.kind==="INVALID_POLICY"?<Alert tone="error">Stored sign-in method is invalid. Please contact an administrator.</Alert>:null}
  <CollegeSigninMethodForm collegeId={college.id}
   method={policy.kind==="CONFIGURED"?policy.method:"EMAIL_AND_PHONE"}
   version={result.version??0}
   ready={policy.kind!=="MIGRATION_PENDING"&&policy.kind!=="INVALID_POLICY"}/>
  <p className="text-xs text-muted-foreground">Changes are versioned for this college's new sign-in code requests. Existing sessions are not revoked. The active login-policy resolver must honor the saved method before the change can be considered live.</p>
  </section>
 </div>;
}
