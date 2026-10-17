import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {CollegeVerificationPanel} from "@/components/verification/CollegeVerificationPanel";
import {listCollegeVerificationQueue,VerificationQueueLimitError} from "@/modules/verification/staff-queue-service";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {parseCollegeVerificationPageQuery,collegeVerificationFilterError} from "@/modules/verification/page-query";
import {verificationLastPage,verificationPageUrl} from "@/modules/verification/page-range";
import {listVerificationBatchOptions,listVerificationBranchOptions,listVerificationClassOptions,listVerificationProgramOptions} from "@/modules/verification/filter-options-service";

export const dynamic="force-dynamic";
export default async function CollegeVerificationPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 if(!context.membership)return <main className="space-y-3 p-6"><h1 className="text-xl font-semibold">Profile verification</h1><p role="alert">Admin not assigned to a college. Ask a Super Admin to assign a college before reviewing students.</p></main>;
 if(!hasMembershipRole(context,"COLLEGE_ADMIN"))redirect("/dashboard");
 const raw=await searchParams;
 const parsed=parseCollegeVerificationPageQuery(raw);
 if(!parsed.success)return <section className="space-y-3 p-4">
  <h1 className="text-xl font-semibold">Profile verification</h1>
  <p role="alert">{collegeVerificationFilterError(raw)}</p>
  <Link href="/college/verification" className="underline">Clear filters</Link>
 </section>;
 let data:Awaited<ReturnType<typeof listCollegeVerificationQueue>>|undefined;
 let loadFailure:"UNAVAILABLE"|"LIMIT"|null=null;
 try{
  data=await listCollegeVerificationQueue(context,parsed.data);
 }catch(error){
  if(error instanceof VerificationUnavailableError)loadFailure="UNAVAILABLE";
  else if(error instanceof VerificationQueueLimitError)loadFailure="LIMIT";
  else throw error;
 }
 if(loadFailure){
  const description=loadFailure==="UNAVAILABLE"
   ?"Verification requires the staged database tables before reviews can open."
   :"This college has more requests than the safe queue cap; narrower server-side filtering is required.";
  return <section className="space-y-3 p-4">
   <h1 className="text-xl font-semibold">Profile verification</h1>
   <p role="alert">{description}</p>
   <Link href="/college/verification" className="underline">Retry</Link>
  </section>;
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
