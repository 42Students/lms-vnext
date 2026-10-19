import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import {TpoSafeCsvDownload} from "@/components/tpo/tpo-safe-csv-download";
import {getCurrentRequestContext} from "@/auth/request-context";
import {TpoVerificationPanel} from "@/components/verification/TpoVerificationPanel";
import {getTpoVerificationQueue} from "@/modules/placements/tpo-verification-queue-service";
import {listTpoBatches} from "@/modules/placements/tpo-batch-workspace-read-service";
import {parseTpoVerificationParams,tpoVerificationHref} from "@/modules/verification/tpo-queue-server-model";

export const dynamic="force-dynamic";

export default async function TpoVerificationPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;
 const parsed=parseTpoVerificationParams(params);
 if(!parsed)return <div className="space-y-3 p-5">
  <PageHeader title="Invalid verification filters" />
  <p role="alert">No verification records were loaded. Choose a supported status or reset the filters.</p>
  <Link href="/tpo/verification" className="text-[var(--lms-teal-deep)] underline">Clear filters</Link>
 </div>;
 const query=parsed;
 const context=await getCurrentRequestContext();
 const queue=await getTpoVerificationQueue(context,query);
 const directory=queue.available&&queue.enabled&&queue.permitted?await listTpoBatches(context):null;
 const branches=[...new Map(directory?.batches.map(item=>[item.departmentId,item.department] as const)??[])];
 return <div className="min-w-0 space-y-4">
  <nav className="flex flex-wrap items-center gap-3">
    <Link href="/tpo/students" className="text-sm text-[var(--lms-teal-deep)] underline">Back to students</Link>
    {queue.available&&queue.enabled&&queue.permitted?
     <div className="flex flex-wrap gap-2">
       {([["WAITING","Waiting"],["SENT_BACK","Sent back"],["VERIFIED","Verified"]] as const).map(([tab,label])=>
        <TpoSafeCsvDownload key={tab} href={"/api/tpo/verification/export?"+new URLSearchParams({
         tab,kind:query.kind,search:query.search,
         ...(query.batchId?{batchId:query.batchId}:{}),
         ...(query.branchId?{branchId:query.branchId}:{}),
        }).toString()} filename={"tpo-verification-"+tab.toLowerCase()+".csv"} label={label+" CSV"} />)}
     </div>:null}
  </nav>
  <form method="get" action="/tpo/verification" className="grid gap-3 border-b border-border py-4 sm:grid-cols-4">
   <label className="grid gap-1 text-sm">Status
    <Select name="tab" defaultValue={query.tab} className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-2">
     <option value="WAITING">Waiting</option><option value="SENT_BACK">Sent back</option><option value="VERIFIED">Verified</option>
    </Select>
   </label>
   <label className="grid gap-1 text-sm">Section
    <Select name="kind" defaultValue={query.kind} className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-2">
     <option value="ALL">All sections</option><option value="EDUCATION">Education</option><option value="IDENTITY">Identity</option>
    </Select>
   </label>
   <label className="grid gap-1 text-sm">Request kind
    <Select name="waitingState" defaultValue={query.waitingState} className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-2">
     <option value="ALL">First check or update</option><option value="SUBMITTED">First check</option><option value="UPDATE_PENDING">Update</option>
    </Select>
   </label>
   <label className="grid gap-1 text-sm">Waiting since
    <Select name="waitingSince" defaultValue={query.waitingSince}
     className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-2"
     disabled={query.tab!=="WAITING"}>
     <option value="ALL">Any time</option>
     <option value="TODAY">Today</option>
     <option value="WEEK">This week</option>
     <option value="OVER_WEEK">Over a week</option>
    </Select>
   </label>
   <label className="grid gap-1 text-sm">Batch
    <Select name="batchId" defaultValue={query.batchId??""} className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-2">
     <option value="">All batches</option>
     {directory?.batches.map(item=><option key={item.id} value={item.id}>{item.program} · {item.name}</option>)}
    </Select>
   </label>
   <label className="grid gap-1 text-sm">Branch
    <Select name="branchId" defaultValue={query.branchId??""} className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-2">
     <option value="">All branches</option>
     {branches.map(([id,name])=><option key={id} value={id}>{name}</option>)}
    </Select>
   </label>
   <label className="grid gap-1 text-sm">Student or roll number
    <input name="search" type="search" defaultValue={query.search} maxLength={100} placeholder="Search name or student number" className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-2"/>
   </label>
   <label className="grid gap-1 text-sm">Page size
    <Select name="pageSize" defaultValue={query.pageSize} className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-2">
     <option value="25">25</option><option value="50">50</option><option value="100">100</option><option value="1000">First 1,000 (legacy view)</option>
    </Select>
   </label>
   <button type="submit" className="min-h-11 rounded-[var(--lms-control-radius)] bg-primary px-4 text-on-primary">Apply filters</button>
   <Link href="/tpo/verification" className="self-center text-[var(--lms-teal-deep)] underline">Reset filters</Link>
  </form>
  {queue.available&&queue.enabled&&queue.permitted&&queue.counts?
   <p role="status" className="text-sm text-body">
    {queue.counts.WAITING} waiting · {queue.counts.SENT_BACK} sent back · {queue.counts.VERIFIED} verified
    {queue.hasMore?" · More students on the next page":""}
   </p>:null}
  {queue.available&&queue.enabled&&queue.permitted&&query.pageSize===1000&&
   (query.tab==="WAITING"?queue.counts?.WAITING:query.tab==="VERIFIED"?queue.counts?.VERIFIED:queue.counts?.SENT_BACK)!==undefined&&
   ((query.tab==="WAITING"?queue.counts?.WAITING:query.tab==="VERIFIED"?queue.counts?.VERIFIED:queue.counts?.SENT_BACK)??0)>1000?
    <p role="status" className="rounded border border-border p-3 text-sm">Showing the first 1,000 students in this view. Narrow the filters to find more students.</p>:null}
  {!queue.available?<section role="status" className="rounded border border-border p-4">
   <PageHeader title="Verification" />
   <p>Verification records are not available right now. Please try again or contact your college admin.</p>
   <Link href="/tpo/verification" className="font-semibold text-[var(--lms-teal-deep)] underline">Retry</Link>
  </section>:!queue.enabled||!queue.permitted?<section role="status" className="rounded border border-border p-4">
   <PageHeader title="You cannot verify profiles here" />
   <p className="text-sm">{!queue.enabled
    ?"Your college admin has not allowed the placement cell to verify profiles"
    :"Your verification access has been removed. Ask your college admin."}</p>
  </section>:<><TpoVerificationPanel rows={queue.rows} counts={queue.counts} serverTab={query.tab} serverKind={query.kind}/>
  <nav aria-label="Verification pages" className="flex items-center gap-3 text-sm">
   {query.page>1?<Link href={tpoVerificationHref({...query,page:query.page-1})} className="text-[var(--lms-teal-deep)] underline">Previous page</Link>:null}
   <span>Page {query.page}; up to {query.pageSize} records per page.</span>
   {queue.hasMore?<Link href={tpoVerificationHref({...query,page:query.page+1})} className="text-[var(--lms-teal-deep)] underline">Next page</Link>:null}
  </nav></>}
 </div>;
}
