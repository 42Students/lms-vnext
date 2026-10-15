import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listTpoBatchRegistrationRoster} from "@/modules/placements/tpo-batch-registration-roster-service";
import {TPO_REGISTRATION_CHOICES} from "@/modules/placements/tpo-batch-registration-summary-model";
export const dynamic="force-dynamic";
export default async function BatchRegistrations({params,searchParams}:{
 params:Promise<{batchId:string}>;
 searchParams:Promise<{q?:string|string[];choice?:string|string[];page?:string|string[];source?:string|string[];recency?:string|string[];order?:string|string[];pageSize?:string|string[]}>}){
 const {batchId}=await params,raw=await searchParams;
 const first=(x:string|string[]|undefined)=>Array.isArray(x)?x[0]:x;
 const value={q:first(raw.q),choice:first(raw.choice),page:first(raw.page),source:first(raw.source),recency:first(raw.recency),order:first(raw.order),pageSize:first(raw.pageSize)};
 const ctx=await getCurrentRequestContext();
 const data=await listTpoBatchRegistrationRoster(ctx,batchId,value);
 const url=(page:number)=>{const params=new URLSearchParams();
  if(data.filters.q)params.set("q",data.filters.q);
  if(data.filters.choice!=="ALL")params.set("choice",data.filters.choice);
  if(data.filters.source!=="ALL")params.set("source",data.filters.source);
  if(data.filters.recency!=="ALL")params.set("recency",data.filters.recency);
  if(data.filters.order!=="NAME_ASC")params.set("order",data.filters.order);
  if(data.filters.pageSize!==25)params.set("pageSize",String(data.filters.pageSize));
  params.set("page",String(page));return "/tpo/batches/"+batchId+"/registrations?"+params.toString();};
 return <main className="min-w-0 space-y-4">
  <h1 className="text-xl font-semibold">{data.batch.name} — Registration choices</h1>
  <Link className="text-sm text-primary-text underline" href={"/tpo/batches/"+batchId}>Batch overview</Link>
  {!data.ready?<p role="status" className="rounded border border-border p-4">Registration storage is unavailable. No learner choices were loaded.</p>:<>
   <form action={"/tpo/batches/"+batchId+"/registrations"} method="get" className="flex min-w-0 flex-wrap items-end gap-2">
    <label className="min-w-0 flex-1 text-sm">Find learner
     <input type="search" name="q" maxLength={100} defaultValue={data.filters.q}
      className="mt-1 min-h-11 w-full rounded border border-border bg-surface px-3"/>
    </label>
    <label className="text-sm">Choice
     <select name="choice" defaultValue={data.filters.choice}
      className="mt-1 min-h-11 rounded border border-border bg-surface px-3">
      <option value="ALL">All choices</option><option value="UNRECORDED">Not recorded</option>
      {TPO_REGISTRATION_CHOICES.map(choice=><option value={choice} key={choice}>{choice.replaceAll("_"," ")}</option>)}
     </select>
    </label>
    <label className="text-sm">Recorded source<select name="source" defaultValue={data.filters.source} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="ALL">Any source</option><option value="SELF">Learner self-service</option><option value="TPO">Placement cell</option><option value="BACKFILL">Backfill</option><option value="UNRECORDED">Not recorded</option></select></label>
    <label className="text-sm">Last recorded update<select name="recency" defaultValue={data.filters.recency} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="ALL">Any date</option><option value="UPDATED_7_DAYS">Within 7 days</option><option value="OLDER_30_DAYS">Older than 30 days</option><option value="NO_RECORD">No recorded choice</option></select></label>
    <label className="text-sm">Order<select name="order" defaultValue={data.filters.order} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="NAME_ASC">Name A–Z</option><option value="NAME_DESC">Name Z–A</option><option value="UPDATED_NEWEST">Recently updated first</option><option value="UPDATED_OLDEST">Oldest updates first</option></select></label>
    <label className="text-sm">Rows per page<select name="pageSize" defaultValue={String(data.filters.pageSize)} className="mt-1 block min-h-11 rounded border border-border bg-surface px-3"><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></label>
    <button type="submit" className="min-h-11 rounded bg-primary px-4 text-sm text-on-primary">Filter</button>
   </form>
   {data.limited?<p role="status" className="rounded border border-border p-3 text-sm">Limited to the first 500 active learners. Filter totals and CSV describe this sample only.</p>:null}
   <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="text-sm text-muted-foreground">{data.total} matching students in {data.sampleSize} sampled records. Page {data.filters.page}.</p>
    <a href={"/api/placements/tpo/batches/"+batchId+"/registrations/export?"+new URLSearchParams({
     q:data.filters.q,choice:data.filters.choice,source:data.filters.source,recency:data.filters.recency,order:data.filters.order,pageSize:String(data.filters.pageSize),page:String(data.filters.page),
    }).toString()} className="inline-flex min-h-11 items-center rounded border border-border px-3 text-sm">
     Export current page CSV
    </a>
   </div>
   {data.items.length===0?<p role="status">No matching students.</p>:
    <ul className="space-y-2">{data.items.map(row=><li key={row.membershipId} className="min-w-0 rounded border border-border p-3 text-sm">
     <div className="flex flex-wrap justify-between gap-2"><strong className="break-words">{row.name}</strong>
      <span>{row.choice?.replaceAll("_"," ")??"Not recorded"}</span></div>
     <p className="text-xs text-muted-foreground">Source: {row.source??"None"}{row.updatedAt?" · Updated "+row.updatedAt:""}</p>
     <Link href={"/tpo/students/"+row.membershipId+"/participation"} className="mt-2 inline-flex min-h-10 items-center text-primary-text underline">Review participation</Link>
    </li>)}</ul>}
   <nav aria-label="Registration pages" className="flex flex-wrap gap-2">
    {data.filters.page>1?<Link href={url(data.filters.page-1)} className="rounded border px-3 py-2">Previous</Link>:null}
    {data.hasMore?<Link href={url(data.filters.page+1)} className="rounded border px-3 py-2">Next</Link>:null}
   </nav>
  </>}
 </main>;
}
