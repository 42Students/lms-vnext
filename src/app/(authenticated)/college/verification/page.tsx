import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {CollegeVerificationPanel} from "@/components/verification/CollegeVerificationPanel";
import {listCollegeVerificationQueue,VerificationQueueLimitError} from "@/modules/verification/staff-queue-service";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {verificationQueueFilters} from "@/modules/verification/queue-filters";
import {verificationLastPage,verificationPageUrl} from "@/modules/verification/page-range";
import {listVerificationBatchOptions,listVerificationBranchOptions,listVerificationClassOptions} from "@/modules/verification/filter-options-service";

export const dynamic="force-dynamic";
export default async function CollegeVerificationPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const raw=await searchParams;
 const single=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,Array.isArray(v)?v[0]:v]).filter(([,v])=>v!==undefined&&v!==""));
 const parsed=verificationQueueFilters.safeParse(single);
 if(!parsed.success)return <section className="space-y-3 p-4">
  <h1 className="text-xl font-semibold">Profile verification</h1>
  <p role="alert">Invalid verification filters. No records were loaded.</p>
  <Link href="/college/verification" className="underline">Clear filters</Link>
 </section>;
 let data:Awaited<ReturnType<typeof listCollegeVerificationQueue>>|undefined;
 let loadFailure:"UNAVAILABLE"|"LIMIT"|null=null;
 try{
  data=await listCollegeVerificationQueue(await getCurrentRequestContext(),parsed.data);
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
 const context=await getCurrentRequestContext();
 const batchChoices=await listVerificationBatchOptions(context);
 const branchChoices=await listVerificationBranchOptions(context);
 const classChoices=await listVerificationClassOptions(context);
 const query:Record<string,string>={};
 for(const [key,value] of Object.entries(data.filter)){
  if(value!==undefined&&value!==null)query[key]=String(value);
 }
 return <CollegeVerificationPanel rows={data.rows} counts={data.counts}
  tpoCanVerify={data.tpoCanVerify} batchChoices={batchChoices} branchChoices={branchChoices} classChoices={classChoices}
  activeTab={data.filter.tab} initialKind={data.filter.kind??"ALL"}
  page={data.page} total={data.total} hasMore={data.hasMore} pageSize={data.filter.pageSize} query={query}/>;
}
