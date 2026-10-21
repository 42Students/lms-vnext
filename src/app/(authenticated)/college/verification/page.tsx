import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {Alert} from "@/components/ui/alert";
import {CollegeVerificationPanel} from "@/components/verification/CollegeVerificationPanel";
import {listCollegeVerificationQueue,VerificationQueueLimitError} from "@/modules/verification/staff-queue-service";
import {VerificationUnavailableError,requireCollegeVerificationActor} from "@/modules/verification/staff-auth";
import {AuthorizationError} from "@/modules/permissions/policy";
import {parseCollegeVerificationPageQuery,collegeVerificationFilterError} from "@/modules/verification/page-query";
import {verificationLastPage,verificationPageUrl} from "@/modules/verification/page-range";
import {listVerificationBatchOptions,listVerificationBranchOptions,listVerificationClassOptions,listVerificationProgramOptions} from "@/modules/verification/filter-options-service";

export const dynamic="force-dynamic";
export default async function CollegeVerificationPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 if(!context.membership)return <div className="min-w-0 max-w-full space-y-6">
  <PageHeader title="Profile verification"/>
  <ErrorState title="Profile verification" description="Admin not assigned to a college. Ask a Super Admin to assign a college before reviewing students."/>
 </div>;
 if(!hasMembershipRole(context,"COLLEGE_ADMIN"))return <div className="min-w-0 space-y-4">
  <PageHeader title="Profile verification"/>
  <Alert tone="info" title="You cannot verify profiles here">Profile verification is available to an assigned College Admin in the selected college. Switch to the correct college and role to review requests.</Alert>
  <Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Back to dashboard</Link>
 </div>;
 // Verify persisted membership separately from loading database queue rows.
 try{await requireCollegeVerificationActor(context);}
 catch(error){
  if(error instanceof AuthorizationError)return <div className="min-w-0 space-y-4">
   <PageHeader title="Profile verification"/>
   <ErrorState title="Verification access required" description="You are not authorized to review profile verification requests in this college."/>
  </div>;
  return <div className="min-w-0 space-y-4">
   <PageHeader title="Profile verification"/>
   <ErrorState title="Could not check your verification access"
    description="The access check could not be completed. This does not mean your access was revoked."
    action={<Link href="/college/verification" prefetch={false} className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Retry access check</Link>}/>
  </div>;
 }
 const raw=await searchParams;
 const parsed=parseCollegeVerificationPageQuery(raw);
 if(!parsed.success)return <div className="min-w-0 max-w-full space-y-6">
  <PageHeader title="Profile verification"/>
  <ErrorState title="Profile verification" description={collegeVerificationFilterError(raw)}
    action={<Link href="/college/verification" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>}/>
 </div>;
 let data:Awaited<ReturnType<typeof listCollegeVerificationQueue>>|undefined;
 let loadFailure:"UNAVAILABLE"|"LIMIT"|"READ_FAILED"|null=null;
 try{
  data=await listCollegeVerificationQueue(context,parsed.data);
 }catch(error){
  if(error instanceof VerificationUnavailableError)loadFailure="UNAVAILABLE";
  else if(error instanceof VerificationQueueLimitError)loadFailure="LIMIT";
  else if(error instanceof AuthorizationError)throw error;
  else loadFailure="READ_FAILED";
 }
 if(loadFailure){
  const description=loadFailure==="UNAVAILABLE"
   ?"Verification requires the staged database tables before reviews can open."
   :loadFailure==="LIMIT"
    ?"This college has more requests than the safe queue cap; narrower server-side filtering is required."
    :"Could not load verification requests from the database. The list was not assumed empty.";
  return <div className="min-w-0 max-w-full space-y-6">
   <PageHeader title="Profile verification"/>
   <Alert tone="error" title={loadFailure==="READ_FAILED"?"Could not load verification requests":"Verification queue unavailable"}>
    {description} The current filters are retained. No prior college's queue is shown as a fallback.
   </Alert>
   <ErrorState title={loadFailure==="READ_FAILED"?"Could not load verification requests":"Profile verification"} description={description}
     action={<Link href={verificationPageUrl(parsed.data,parsed.data.page)} prefetch={false} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Retry</Link>}/>
  </div>;
 }
 if(!data)throw new Error("VERIFICATION_QUEUE_UNAVAILABLE");
 const lastPage=verificationLastPage(data.total,data.filter.pageSize);
 if(data.page>lastPage)redirect(verificationPageUrl(data.filter,lastPage));
 const batchChoices=await listVerificationBatchOptions(context);
 const branchChoices=await listVerificationBranchOptions(context);
 const classChoices=await listVerificationClassOptions(context);
 const programChoices=await listVerificationProgramOptions(context);
 const query:Record<string,string>={};
 for(const [key,value] of Object.entries(data.filter)){
  if(value!==undefined&&value!==null)query[key]=String(value);
 }
 return <CollegeVerificationPanel rows={data.rows} counts={data.counts}
  tpoCanVerify={data.tpoCanVerify} batchChoices={batchChoices} branchChoices={branchChoices} classChoices={classChoices} programChoices={programChoices}
  activeTab={data.filter.tab} initialKind={data.filter.kind??"ALL"}
  page={data.page} total={data.total} hasMore={data.hasMore} pageSize={data.filter.pageSize} query={query} truncated={data.truncated}/>;
}
