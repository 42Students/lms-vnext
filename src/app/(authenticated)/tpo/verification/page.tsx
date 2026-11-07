import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
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
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";

export const dynamic="force-dynamic";

export default async function TpoVerificationPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;
 const parsed=parseTpoVerificationParams(params);
 if(!parsed)return <div className="min-w-0 space-y-3">
  <PageHeader title="Invalid verification filters" />
  <Alert tone="error">No verification records were loaded. Choose a supported status or reset the filters.</Alert>
  <TextLink href="/tpo/verification" className="inline-flex min-h-11 items-center text-sm md:min-h-9">Clear filters</TextLink>
 </div>;
 const query=parsed;
 const activeFilters=[query.kind!=="ALL",query.waitingState!=="ALL",query.waitingSince!=="ALL",
  Boolean(query.search),Boolean(query.batchId),Boolean(query.branchId),query.pageSize!==1000]
  .filter(Boolean).length;
 const {batchId,branchId,...unscopedQuery}=query;
 void batchId;
 void branchId;
 const resetToTab=tpoVerificationHref({...unscopedQuery,kind:"ALL",waitingState:"ALL",
  waitingSince:"ALL",search:"",page:1});
 const context=await getCurrentRequestContext();
 const retryHref=tpoVerificationHref(query);
 let queue:Awaited<ReturnType<typeof getTpoVerificationQueue>>;
 try {
  queue=await getTpoVerificationQueue(context,query);
 } catch(error) {
  if(error instanceof AuthorizationError) {
   return <section className="min-w-0 space-y-3">
    <PageHeader title="Verification" />
    <Heading level={2} size="base">You cannot verify profiles here</Heading>
    <Alert tone="warning">Your verification access has been removed. Ask your college admin.</Alert>
   </section>;
  }
  return <section className="min-w-0 space-y-3">
   <PageHeader title="Verification" />
   <Alert tone="error" role="alert">Could not check your verification access</Alert>
   <TextLink href={retryHref} className="inline-flex min-h-11 items-center md:min-h-9">Retry</TextLink>
  </section>;
 }
 // A batch-directory failure must not erase a successfully loaded queue.
 const directory=queue.available&&queue.enabled&&queue.permitted
  ? await listTpoBatches(context).catch(()=>null) : null;
 const branches=[...new Map(directory?.batches.map(item=>[item.departmentId,item.department] as const)??[])];
 return <div data-testid="tpo.verification" className="min-w-0 space-y-4">
  <PageHeader title="Verification" description="Check students' education and identity against their documents. Verified marks are what eligibility uses." />
  {queue.available&&queue.enabled&&queue.permitted?<nav aria-label="Verification status" className="flex min-w-0 flex-wrap gap-2 border-b border-border pb-3">
    {([["WAITING","Waiting"],["SENT_BACK","Sent back"],["VERIFIED","Verified"]] as const).map(([tab,label])=>
      <TextLink variant="bare" key={tab} href={tpoVerificationHref({...query,tab,page:1})} aria-current={query.tab===tab?"page":undefined}
        className={"inline-flex min-h-11 items-center rounded-[8px] border px-4 text-sm font-semibold md:min-h-9 "+
          (query.tab===tab?"border-primary bg-primary text-on-primary":"border-border text-body hover:bg-primary-subtle")}>
        {label} ({queue.counts?.[tab]??0})
      </TextLink>)}
   </nav>:null}
  <nav className="min-w-0" aria-label="Verification exports">
   <Disclosure title="Export verification records">
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
   </Disclosure>
  </nav>
  <form method="get" action="/tpo/verification" className="min-w-0 border-b border-border pb-3" aria-label="Filter verification">
   <Disclosure title={activeFilters ? "Filter the queue ("+activeFilters+" active)" : "Filter the queue"} defaultOpen={activeFilters>0}>
    <div className="grid min-w-0 grid-cols-1 gap-3 pb-4 sm:grid-cols-2 lg:grid-cols-4">
   <Label stack>Status
    <Select name="tab" defaultValue={query.tab} className="min-h-11 md:min-h-9">
     <option value="WAITING">Waiting</option><option value="SENT_BACK">Sent back</option><option value="VERIFIED">Verified</option>
    </Select>
   </Label>
   <Label stack>Section
    <Select name="kind" defaultValue={query.kind} className="min-h-11 md:min-h-9">
     <option value="ALL">All sections</option><option value="EDUCATION">Education</option><option value="IDENTITY">Identity</option>
    </Select>
   </Label>
   <Label stack>Student or roll number
    <Input name="search" type="search" defaultValue={query.search} maxLength={100} placeholder="Search name or student number" className="min-h-11 min-w-0 w-full md:min-h-9" />
   </Label>
   <Disclosure title="More filters" className="min-w-0 sm:col-span-2 lg:col-span-4">
    <div className="grid min-w-0 grid-cols-1 gap-3 py-3 sm:grid-cols-2 lg:grid-cols-4">
   <Label stack>Request kind
    <Select name="waitingState" defaultValue={query.waitingState} className="min-h-11 md:min-h-9">
     <option value="ALL">First check or update</option><option value="SUBMITTED">First check</option><option value="UPDATE_PENDING">Update</option>
    </Select>
   </Label>
   <Label stack>Waiting since
    <Select name="waitingSince" defaultValue={query.waitingSince}
     className="min-h-11 md:min-h-9"
     disabled={query.tab!=="WAITING"}>
     <option value="ALL">Any time</option>
     <option value="TODAY">Today</option>
     <option value="WEEK">This week</option>
     <option value="OVER_WEEK">Over a week</option>
    </Select>
   </Label>
   <Label stack>Batch
    <Select name="batchId" defaultValue={query.batchId??""} className="min-h-11 md:min-h-9">
     <option value="">All batches</option>
     {directory?.batches.map(item=><option key={item.id} value={item.id}>{item.program} · {item.name}</option>)}
    </Select>
   </Label>
   <Label stack>Branch
    <Select name="branchId" defaultValue={query.branchId??""} className="min-h-11 md:min-h-9">
     <option value="">All branches</option>
     {branches.map(([id,name])=><option key={id} value={id}>{name}</option>)}
    </Select>
   </Label>
   <Label stack>Page size
    <Select name="pageSize" defaultValue={query.pageSize} className="min-h-11 md:min-h-9">
     <option value="25">25</option><option value="50">50</option><option value="100">100</option><option value="1000">First 1,000 (legacy view)</option>
    </Select>
   </Label>
    </div>
   </Disclosure>
   <Button type="submit" className="min-h-11 w-full md:min-h-9">Apply filters</Button>
   <TextLink href="/tpo/verification" className="inline-flex min-h-11 items-center justify-center text-sm md:min-h-9">Reset filters</TextLink>
    </div>
   </Disclosure>
  </form>
  {activeFilters>0?<div role="status" className="flex min-w-0 flex-wrap items-center gap-3 text-sm text-body">
   <span>{activeFilters} active filter{activeFilters===1?"":"s"} applied to this verification view.</span>
   <TextLink href={resetToTab} className="inline-flex min-h-11 items-center md:min-h-9">Clear filters (keep status)</TextLink>
  </div>:null}
  {queue.available&&queue.enabled&&queue.permitted&&queue.counts?
   <p role="status" className="text-sm text-body leading-[22px]">
    {queue.counts.WAITING} waiting · {queue.counts.SENT_BACK} sent back · {queue.counts.VERIFIED} verified
    {queue.hasMore?" · More students on the next page":""}
   </p>:null}
  {queue.available&&queue.enabled&&queue.permitted&&query.pageSize===1000&&
   (query.tab==="WAITING"?queue.counts?.WAITING:query.tab==="VERIFIED"?queue.counts?.VERIFIED:queue.counts?.SENT_BACK)!==undefined&&
   ((query.tab==="WAITING"?queue.counts?.WAITING:query.tab==="VERIFIED"?queue.counts?.VERIFIED:queue.counts?.SENT_BACK)??0)>1000?
    <Alert tone="warning" role="alert">Showing the first 1,000 students in this view. Search, filters and counts below cover only these. Verify these first and the next students appear; older submissions are listed first.</Alert>:null}
  {!queue.available?<section className="space-y-3">
   <Alert tone="warning" role="alert">Could not load the queue. Please try again or contact your college admin.</Alert>
   <TextLink href={retryHref} className="inline-flex min-h-11 items-center md:min-h-9">Retry</TextLink>
  </section>:!queue.enabled||!queue.permitted?<section className="space-y-3">
   <Heading level={2} size="base" className="text-[var(--lms-heading)]">You cannot verify profiles here</Heading>
   <Alert tone="warning">{!queue.enabled
    ?"Your college admin has not allowed the placement cell to verify profiles"
     :"Your verification access has been removed. Ask your college admin."}</Alert>
  </section>:<><TpoVerificationPanel rows={queue.rows} {...(queue.counts !== undefined ? {counts:queue.counts} : {})} serverTab={query.tab} serverKind={query.kind}/>
  <nav aria-label="Verification pages" className="flex min-w-0 flex-wrap items-center gap-3 text-sm">
   {query.page>1?<TextLink href={tpoVerificationHref({...query,page:query.page-1})} className="inline-flex min-h-11 items-center md:min-h-9">Previous page</TextLink>:null}
   <span>Page {query.page}; up to {query.pageSize} records per page.</span>
   {queue.hasMore?<TextLink href={tpoVerificationHref({...query,page:query.page+1})} className="inline-flex min-h-11 items-center md:min-h-9">Next page</TextLink>:null}
  </nav></>}
 </div>;
}
