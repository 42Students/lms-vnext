import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import {TpoSafeCsvDownload} from "@/components/tpo/tpo-safe-csv-download";
import {getCurrentRequestContext} from "@/auth/request-context";
import {TpoVerificationPanel} from "@/components/verification/TpoVerificationPanel";
import {getTpoVerificationQueue} from "@/modules/placements/tpo-verification-queue-service";
import {listTpoBatches} from "@/modules/placements/tpo-batch-workspace-read-service";
import {parseTpoVerificationParams,tpoVerificationHref} from "@/modules/verification/tpo-queue-server-model";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {AuthorizationError} from "@/modules/permissions/policy";
import {Select} from "@/components/ui/select";

export const dynamic="force-dynamic";

export default async function TpoVerificationPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;
 const parsed=parseTpoVerificationParams(params);
 if(!parsed)return <div className="min-w-0 space-y-3">
  <PageHeader title="Invalid verification filters" />
  <Alert tone="error">No verification records were loaded. Choose a supported status or reset the filters.</Alert>
  <Link href="/tpo/verification" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Clear filters</Link>
 </div>;
 const query=parsed;
 const context=await getCurrentRequestContext();
 const retryHref=tpoVerificationHref(query);
 let queue:Awaited<ReturnType<typeof getTpoVerificationQueue>>;
 try {
  queue=await getTpoVerificationQueue(context,query);
 } catch(error) {
  if(error instanceof AuthorizationError) {
   return <section className="min-w-0 space-y-3">
    <PageHeader title="Verification" />
    <h2 className="text-base font-semibold">You cannot verify profiles here</h2>
    <Alert tone="warning">Your verification access has been removed. Ask your college admin.</Alert>
   </section>;
  }
  return <section className="min-w-0 space-y-3">
   <PageHeader title="Verification" />
   <Alert tone="error" role="alert">Could not check your verification access</Alert>
   <Link href={retryHref} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry</Link>
  </section>;
 }
 // A batch-directory failure must not erase a successfully loaded queue.
 const directory=queue.available&&queue.enabled&&queue.permitted
  ? await listTpoBatches(context).catch(()=>null) : null;
 const branches=[...new Map(directory?.batches.map(item=>[item.departmentId,item.department] as const)??[])];
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Verification" description="Review learner education and identity verification requests."
    actions={<Link href="/tpo/students" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Back to students</Link>} />
  <nav className="min-w-0" aria-label="Verification exports">
   <details className="border-b border-border pb-3"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold md:min-h-9">Export verification records</summary>
   <div className="flex min-w-0 flex-wrap gap-2 py-2">
    {queue.available&&queue.enabled&&queue.permitted?
     <div className="flex flex-wrap gap-2">
       {([["WAITING","Waiting"],["SENT_BACK","Sent back"],["VERIFIED","Verified"]] as const).map(([tab,label])=>
        <TpoSafeCsvDownload key={tab} href={"/api/tpo/verification/export?"+new URLSearchParams({
         tab,kind:query.kind,search:query.search,
         ...(query.batchId?{batchId:query.batchId}:{}),
         ...(query.branchId?{branchId:query.branchId}:{}),
        }).toString()} filename={"tpo-verification-"+tab.toLowerCase()+".csv"} label={label+" CSV"} />)}
     </div>:null}
   </div>
   </details>
  </nav>
  <form method="get" action="/tpo/verification" className="grid min-w-0 grid-cols-1 gap-3 border-b border-border py-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filter verification">
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
    <Select name="tab" defaultValue={query.tab} className="min-h-11 md:min-h-9">
     <option value="WAITING">Waiting</option><option value="SENT_BACK">Sent back</option><option value="VERIFIED">Verified</option>
    </Select>
   </label>
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Section
    <Select name="kind" defaultValue={query.kind} className="min-h-11 md:min-h-9">
     <option value="ALL">All sections</option><option value="EDUCATION">Education</option><option value="IDENTITY">Identity</option>
    </Select>
   </label>
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Student or roll number
    <Input name="search" type="search" defaultValue={query.search} maxLength={100} placeholder="Search name or student number" className="min-h-11 min-w-0 w-full md:min-h-9" />
   </label>
   <details className="min-w-0 sm:col-span-2 lg:col-span-4">
    <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold md:min-h-9">More filters</summary>
    <div className="grid min-w-0 grid-cols-1 gap-3 py-3 sm:grid-cols-2 lg:grid-cols-4">
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Request kind
    <Select name="waitingState" defaultValue={query.waitingState} className="min-h-11 md:min-h-9">
     <option value="ALL">First check or update</option><option value="SUBMITTED">First check</option><option value="UPDATE_PENDING">Update</option>
    </Select>
   </label>
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Waiting since
    <Select name="waitingSince" defaultValue={query.waitingSince}
     className="min-h-11 md:min-h-9"
     disabled={query.tab!=="WAITING"}>
     <option value="ALL">Any time</option>
     <option value="TODAY">Today</option>
     <option value="WEEK">This week</option>
     <option value="OVER_WEEK">Over a week</option>
    </Select>
   </label>
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch
    <Select name="batchId" defaultValue={query.batchId??""} className="min-h-11 md:min-h-9">
     <option value="">All batches</option>
     {directory?.batches.map(item=><option key={item.id} value={item.id}>{item.program} · {item.name}</option>)}
    </Select>
   </label>
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Branch
    <Select name="branchId" defaultValue={query.branchId??""} className="min-h-11 md:min-h-9">
     <option value="">All branches</option>
     {branches.map(([id,name])=><option key={id} value={id}>{name}</option>)}
    </Select>
   </label>
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Page size
    <Select name="pageSize" defaultValue={query.pageSize} className="min-h-11 md:min-h-9">
     <option value="25">25</option><option value="50">50</option><option value="100">100</option><option value="1000">First 1,000 (legacy view)</option>
    </Select>
   </label>
    </div>
   </details>
   <Button type="submit" className="min-h-11 w-full md:min-h-9">Apply filters</Button>
   <Link href="/tpo/verification" className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-primary-text underline md:min-h-9">Reset filters</Link>
  </form>
  {queue.available&&queue.enabled&&queue.permitted&&queue.counts?
   <p role="status" className="text-sm text-body leading-[22px]">
    {queue.counts.WAITING} waiting · {queue.counts.SENT_BACK} sent back · {queue.counts.VERIFIED} verified
    {queue.hasMore?" · More students on the next page":""}
   </p>:null}
  {queue.available&&queue.enabled&&queue.permitted&&query.pageSize===1000&&
   (query.tab==="WAITING"?queue.counts?.WAITING:query.tab==="VERIFIED"?queue.counts?.VERIFIED:queue.counts?.SENT_BACK)!==undefined&&
   ((query.tab==="WAITING"?queue.counts?.WAITING:query.tab==="VERIFIED"?queue.counts?.VERIFIED:queue.counts?.SENT_BACK)??0)>1000?
    <Alert tone="warning">Showing the first 1,000 students in this view. Narrow the filters to find more students.</Alert>:null}
  {!queue.available?<section className="space-y-3">
   <Alert tone="warning" role="alert">Could not load the queue. Please try again or contact your college admin.</Alert>
   <Link href={retryHref} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry</Link>
  </section>:!queue.enabled||!queue.permitted?<section className="space-y-3">
   <h2 className="text-base font-semibold text-[var(--lms-heading)]">You cannot verify profiles here</h2>
   <Alert tone="warning">{!queue.enabled
    ?"Your college admin has not allowed the placement cell to verify profiles"
     :"Your verification access has been removed. Ask your college admin."}</Alert>
  </section>:<><TpoVerificationPanel rows={queue.rows} counts={queue.counts} serverTab={query.tab} serverKind={query.kind}/>
  <nav aria-label="Verification pages" className="flex min-w-0 flex-wrap items-center gap-3 text-sm">
   {query.page>1?<Link href={tpoVerificationHref({...query,page:query.page-1})} className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9">Previous page</Link>:null}
   <span>Page {query.page}; up to {query.pageSize} records per page.</span>
   {queue.hasMore?<Link href={tpoVerificationHref({...query,page:query.page+1})} className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9">Next page</Link>:null}
  </nav></>}
 </div>;
}
