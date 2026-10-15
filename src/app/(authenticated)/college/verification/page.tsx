import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {VerificationWorkspace} from "@/components/verification/VerificationWorkspace";
import {listCollegeVerificationQueue,VerificationQueueLimitError} from "@/modules/verification/staff-queue-service";
import {VerificationUnavailableError} from "@/modules/verification/staff-auth";
import {verificationQueueFilters} from "@/modules/verification/queue-filters";

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
 let data;
 try{
  data=await listCollegeVerificationQueue(await getCurrentRequestContext(),parsed.data);
 }catch(error){
  if(!(error instanceof VerificationUnavailableError)&&!(error instanceof VerificationQueueLimitError))throw error;
  return <section className="space-y-3 p-4">
   <h1 className="text-xl font-semibold">Profile verification</h1>
   <p role="alert">{error instanceof VerificationUnavailableError?"Verification requires the staged database tables before reviews can open.":"This college has more requests than the safe queue cap; narrower server-side filtering is required."}</p>
   <Link href="/college/verification" className="underline">Retry</Link>
  </section>;
 }
 return <div className="space-y-4">
   <VerificationWorkspace rows={data.rows} counts={data.counts}/>
   <p className="text-sm text-muted-foreground">Showing {data.rows.length} of {data.total} matching requests in this status.</p>
   {data.page>1&&<Link className="underline" href={`/college/verification?tab=${data.filter.tab}&page=${data.page-1}`}>Previous page</Link>}
   {data.hasMore&&<Link className="ml-4 underline" href={`/college/verification?tab=${data.filter.tab}&page=${data.page+1}`}>Next page</Link>}
 </div>;
}
