import Link from "next/link";
import {TpoSafeCsvDownload} from "@/components/tpo/tpo-safe-csv-download";
import {getCurrentRequestContext} from "@/auth/request-context";
import {TpoVerificationPanel} from "@/components/verification/TpoVerificationPanel";
import {getTpoVerificationQueue} from "@/modules/placements/tpo-verification-queue-service";
import {listTpoBatches} from "@/modules/placements/tpo-batch-workspace-read-service";
import {tpoVerificationQuerySchema,tpoVerificationHref} from "@/modules/verification/tpo-queue-server-model";

export const dynamic="force-dynamic";

export default async function TpoVerificationPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;
 const first=(key:string)=>Array.isArray(params[key])?params[key][0]:params[key];
 const parsed=tpoVerificationQuerySchema.safeParse({
  tab:first("tab"),kind:first("kind"),waitingState:first("waitingState"),waitingSince:first("waitingSince"),
  page:first("page"),pageSize:first("pageSize"),search:first("search"),
  batchId:first("batchId")||undefined,branchId:first("branchId")||undefined,
 });
 if(!parsed.success)return <main className="space-y-3 p-5">
  <h1 className="text-lg font-semibold">Invalid verification filters</h1>
  <p role="alert">No verification records were loaded. Choose a supported status or reset the filters.</p>
  <Link href="/tpo/verification" className="text-primary-text underline">Clear filters</Link>
 </main>;
 const query=parsed.data;
 const context=await getCurrentRequestContext();
 const queue=await getTpoVerificationQueue(context,query);
 const directory=queue.available&&queue.enabled&&queue.permitted?await listTpoBatches(context):null;
 const branches=[...new Map(directory?.batches.map(item=>[item.departmentId,item.department] as const)??[])];
 return <main className="min-w-0 space-y-4">
  <nav className="flex flex-wrap items-center gap-3">
    <Link href="/tpo/students" className="text-sm text-primary-text underline">Back to students</Link>
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
  <form method="get" action="/tpo/verification" className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-4">
   <label className="grid gap-1 text-sm">Status
    <select name="tab" defaultValue={query.tab} className="min-h-11 rounded border border-border bg-surface px-2">
     <option value="WAITING">Waiting</option><option value="SENT_BACK">Sent back</option><option value="VERIFIED">Verified</option>
    </select>
   </label>
   <label className="grid gap-1 text-sm">Section
    <select name="kind" defaultValue={query.kind} className="min-h-11 rounded border border-border bg-surface px-2">
     <option value="ALL">All sections</option><option value="EDUCATION">Education</option><option value="IDENTITY">Identity</option>
    </select>
   </label>
   <label className="grid gap-1 text-sm">Request kind
    <select name="waitingState" defaultValue={query.waitingState} className="min-h-11 rounded border border-border bg-surface px-2">
     <option value="ALL">First check or update</option><option value="SUBMITTED">First check</option><option value="UPDATE_PENDING">Update</option>
    </select>
   </label>
   <label className="grid gap-1 text-sm">Waiting since
    <select name="waitingSince" defaultValue={query.waitingSince}
     className="min-h-11 rounded border border-border bg-surface px-2"
     disabled={query.tab!=="WAITING"}>
     <option value="ALL">Any time</option>
     <option value="TODAY">Today</option>
     <option value="WEEK">This week</option>
     <option value="OVER_WEEK">Over a week</option>
    </select>
   </label>
   <label className="grid gap-1 text-sm">Batch
    <select name="batchId" defaultValue={query.batchId??""} className="min-h-11 rounded border border-border bg-surface px-2">
     <option value="">All batches</option>
     {directory?.batches.map(item=><option key={item.id} value={item.id}>{item.program} · {item.name}</option>)}
    </select>
   </label>
   <label className="grid gap-1 text-sm">Branch
    <select name="branchId" defaultValue={query.branchId??""} className="min-h-11 rounded border border-border bg-surface px-2">
     <option value="">All branches</option>
     {branches.map(([id,name])=><option key={id} value={id}>{name}</option>)}
    </select>
   </label>
   <label className="grid gap-1 text-sm">Student or roll number
    <input name="search" type="search" defaultValue={query.search} maxLength={100} placeholder="Search name or student number" className="min-h-11 rounded border border-border bg-surface px-2"/>
   </label>
   <label className="grid gap-1 text-sm">Page size
    <select name="pageSize" defaultValue={query.pageSize} className="min-h-11 rounded border border-border bg-surface px-2">
     <option value="25">25</option><option value="50">50</option><option value="100">100</option>
    </select>
   </label>
   <button type="submit" className="min-h-11 rounded bg-primary px-4 text-on-primary">Apply filters</button>
   <Link href="/tpo/verification" className="self-center text-primary-text underline">Reset filters</Link>
  </form>
  {!queue.available?<section role="status" className="rounded border border-border p-4">
   <h1 className="font-semibold">Verification</h1>
   <p>Could not check your verification access</p>
  </section>:!queue.enabled||!queue.permitted?<section role="status" className="rounded border border-border p-4">
   <h1 className="font-semibold">You cannot verify profiles here</h1>
   <p className="text-sm">{!queue.enabled
    ?"Your college admin has not allowed the placement cell to verify profiles"
    :"Your verification access has been removed. Ask your college admin."}</p>
  </section>:<><TpoVerificationPanel rows={queue.rows} counts={queue.counts} serverTab={query.tab} serverKind={query.kind}/>
  <nav aria-label="Verification pages" className="flex items-center gap-3 text-sm">
   {query.page>1?<Link href={tpoVerificationHref({...query,page:query.page-1})} className="text-primary-text underline">Previous page</Link>:null}
   <span>Page {query.page}; up to {query.pageSize} records per page.</span>
   {queue.hasMore?<Link href={tpoVerificationHref({...query,page:query.page+1})} className="text-primary-text underline">Next page</Link>:null}
  </nav></>}
 </main>;
}
