import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoDriveOfferRegister} from "@/modules/placements/tpo-drive-offer-register-service";
import {offerRegisterQuery} from "@/modules/placements/tpo-drive-offer-register-model";
export default async function OffersPage({params,searchParams}:{params:Promise<{jobId:string}>,searchParams:Promise<{status?:string|string[];page?:string|string[];q?:string|string[];joining?:string|string[];kind?:string|string[];expiry?:string|string[];minCtcLpa?:string|string[];maxCtcLpa?:string|string[]}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const [p,q]=await Promise.all([params,searchParams]);
 const raw=Array.isArray(q.status)?q.status[0]:q.status;
 const page=Array.isArray(q.page)?q.page[0]:q.page;
 const qterm=Array.isArray(q.q)?q.q[0]:q.q;
 const joiningRaw=Array.isArray(q.joining)?q.joining[0]:q.joining;
 const kindRaw=Array.isArray(q.kind)?q.kind[0]:q.kind;
 const expiryRaw=Array.isArray(q.expiry)?q.expiry[0]:q.expiry;
 const minCtcRaw=Array.isArray(q.minCtcLpa)?q.minCtcLpa[0]:q.minCtcLpa;
 const maxCtcRaw=Array.isArray(q.maxCtcLpa)?q.maxCtcLpa[0]:q.maxCtcLpa;
 const parsed=offerRegisterQuery.safeParse({jobId:p.jobId,status:raw||"ALL",...(page?{page}:{}),...(qterm?{q:qterm}:{}),...(joiningRaw?{joining:joiningRaw}:{}),...(kindRaw?{kind:kindRaw}:{}),...(expiryRaw?{expiry:expiryRaw}:{}),...(minCtcRaw?{minCtcLpa:minCtcRaw}:{}),...(maxCtcRaw?{maxCtcLpa:maxCtcRaw}:{})});
 if(!parsed.success)notFound();
 let data:Awaited<ReturnType<typeof getTpoDriveOfferRegister>>;
 try{data=await getTpoDriveOfferRegister(context,parsed.data)}
 catch(e){if(e instanceof PlacementsServiceError&&e.code==="PLACEMENT_JOB_NOT_FOUND")notFound();throw e}
 const formatIst=(iso:string|null)=>iso?new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(iso))+" IST":"Not recorded";
 const root="/tpo/placements/jobs/"+encodeURIComponent(data.job.id);
 const searchQuery=parsed.data.q;
 const searchSuffix=(searchQuery?"&q="+encodeURIComponent(searchQuery):"")+(parsed.data.joining!=="ALL"?"&joining="+parsed.data.joining:"")+(parsed.data.kind!=="ALL"?"&kind="+parsed.data.kind:"")+(parsed.data.expiry!=="ALL"?"&expiry="+parsed.data.expiry:"")+(parsed.data.minCtcLpa!==undefined?"&minCtcLpa="+parsed.data.minCtcLpa:"")+(parsed.data.maxCtcLpa!==undefined?"&maxCtcLpa="+parsed.data.maxCtcLpa:"");
 const csvFilters=new URLSearchParams({status:data.status,joining:parsed.data.joining,kind:parsed.data.kind,expiry:parsed.data.expiry});
 if(searchQuery)csvFilters.set("q",searchQuery);
 if(parsed.data.minCtcLpa!==undefined)csvFilters.set("minCtcLpa",String(parsed.data.minCtcLpa));
 if(parsed.data.maxCtcLpa!==undefined)csvFilters.set("maxCtcLpa",String(parsed.data.maxCtcLpa));
 const csvHref="/api/placements/tpo/jobs/"+encodeURIComponent(data.job.id)+"/offers/export?"+csvFilters.toString();
 const tabs=[["ALL","All",data.counts.all],["ISSUED","Issued",data.counts.issued],["ACCEPTED","Accepted",data.counts.accepted],["DECLINED","Declined",data.counts.declined],["WITHDRAWN","Withdrawn",data.counts.withdrawn]] as const;
 return <div className="space-y-6">
  <Link href={root} className="text-sm font-semibold text-primary-text">← Back to drive</Link>
  <PageHeader eyebrow="TPO · Offers" title={data.job.title+" · Offer register"} description="Persisted offer versions and recorded joining outcomes; screening results are not employer selection."
   actions={<a href={csvHref} className="inline-flex min-h-10 items-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary">Export filtered CSV</a>}/>
  <p className="rounded-md border border-border bg-surface-subtle p-3 text-sm text-body">Students see an offer only when you release it. The respond-by time is at least 48 hours. Sunday and holiday rules prevent an offer deadline from ending on a non-working day.</p>
  <nav aria-label="Offer status" className="flex flex-wrap gap-2">{tabs.map(([value,label,count])=>
   <Link key={value} href={root+"/offers?status="+value+searchSuffix} aria-current={data.status===value?"page":undefined}
    className="inline-flex min-h-10 items-center rounded border border-border bg-surface px-3 text-sm font-semibold text-primary-text">{label} ({count})</Link>)}</nav>
  <form method="get" action={root+"/offers"} className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
   <input type="hidden" name="status" value={data.status}/>
   <label className="grid gap-1 text-sm font-semibold text-body">Joining outcome
    <select name="joining" defaultValue={parsed.data.joining} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
     <option value="ALL">All joining outcomes</option><option value="PENDING">Accepted / pending</option>
     <option value="JOINED">Confirmed joined</option><option value="DEFERRED">Deferred</option>
     <option value="DID_NOT_JOIN">Did not join</option>
    </select>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Offer type
    <select name="kind" defaultValue={parsed.data.kind} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
     <option value="ALL">All kinds</option><option value="OFFER">Offer</option><option value="LOI">Letter of intent</option>
    </select>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Response deadline
    <select name="expiry" defaultValue={parsed.data.expiry}
      className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
     <option value="ALL">Any response deadline</option>
     <option value="DUE_SOON">Due within 7 days</option>
     <option value="EXPIRED">Time is up</option>
     <option value="OPEN">More than 7 days left</option>
     <option value="UNKNOWN">No expiry recorded</option>
    </select>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Minimum package (LPA)
    <input type="number" name="minCtcLpa" min={0} max={1000} step="0.01"
      defaultValue={parsed.data.minCtcLpa??""}
      className="min-h-11 w-36 rounded-md border border-border bg-surface px-3 text-foreground"/>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Maximum package (LPA)
    <input type="number" name="maxCtcLpa" min={0} max={1000} step="0.01"
      defaultValue={parsed.data.maxCtcLpa??""}
      className="min-h-11 w-36 rounded-md border border-border bg-surface px-3 text-foreground"/>
   </label>
   <label className="grid flex-1 gap-1 text-sm font-semibold text-body">Search learner, email, roll, batch, branch or role
    <input type="search" name="q" maxLength={100} defaultValue={searchQuery} placeholder="Name or offer role" className="min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-3 text-foreground"/>
   </label><button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Search</button>
   {searchQuery||parsed.data.joining!=="ALL"||parsed.data.kind!=="ALL"||parsed.data.expiry!=="ALL"||parsed.data.minCtcLpa!==undefined||parsed.data.maxCtcLpa!==undefined?<Link href={root+"/offers?status="+data.status} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text">Clear filters</Link>:null}
  </form>
  <p role="status" className="text-sm text-body">Showing {data.totalMatching===0?0:(data.page-1)*data.pageSize+1}–{Math.min(data.totalMatching,data.page*data.pageSize)} of {data.totalMatching} matching offer versions. Page {data.page} of {data.totalPages}.</p>
  {data.rows.length===0?<p role="status" className="rounded border border-border p-5 text-sm">No offers match this filter.</p>:
   <section aria-label="Recorded offers" className="grid gap-3">{data.rows.map(row=><article key={row.id} className="rounded-xl border border-border bg-surface p-4">
    <div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold text-foreground">{row.name}</h2><p className="text-sm text-body">{row.role} · {row.kind==="LOI"?"Letter of intent":"Offer"} · {row.annualCtcInr==null?"Pay not recorded":"₹"+(row.annualCtcInr/100000).toLocaleString("en-IN")+" LPA"}</p><p className="mt-1 text-xs text-body">Roll: {row.rollNumber??"Not recorded"} · Batch: {row.batch??"Not recorded"} · Branch: {row.branch??"Not recorded"}</p></div><strong className="text-sm">{row.status}</strong></div>
    <p className="mt-2 text-xs text-body">Fixed: {row.fixedLpa===null?"Not recorded":row.fixedLpa+" LPA"} · Variable: {row.variableLpa===null?"Not recorded":row.variableLpa+" LPA"} · Joining bonus: {row.joiningBonusLpa===null?"Not recorded":row.joiningBonusLpa+" LPA"} · Bond: {row.bondMonths===null?"Not recorded":row.bondMonths+" months"}</p>
    {row.acceptanceChannel?<p className="mt-1 text-xs text-body">
      Acceptance evidence: {row.acceptanceChannel}
      {row.acceptedDisputableUntil?" · Dispute window until "+formatIst(row.acceptedDisputableUntil):""}
    </p>:null}
    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3"><div><dt>Issued</dt><dd><time dateTime={row.issued}>{formatIst(row.issued)}</time></dd></div><div><dt>Responded</dt><dd>{row.responded?<time dateTime={row.responded}>{formatIst(row.responded)}</time>:"Not recorded"}</dd></div><div><dt>Joining</dt><dd>{row.joining??"Not applicable"}</dd></div>
    <div><dt>Offer expiry</dt><dd>{row.expires?<time dateTime={row.expires}>{formatIst(row.expires)}</time>:"Not recorded"}</dd></div><div><dt>Respond by</dt><dd>{row.respondByHours===null?"Not applicable":row.respondByHours===0?"Time is up":row.respondByHours+" h left"}</dd></div>
    <div><dt>Email</dt><dd>{row.email??"Not recorded"}</dd></div><div><dt>Phone</dt><dd>{row.phone??"Not recorded"}</dd></div><div><dt>Rules check</dt><dd title="Offer state only; consult the college placement rules for eligibility and held-offer limits.">{row.ruleCheck}</dd></div>
    {row.expiryIndicator!=="NOT_APPLICABLE"?<div><dt>Issued-offer expiry state</dt><dd>{row.expiryIndicator.replaceAll("_"," ").toLowerCase()}</dd></div>:null}</dl>
    <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold"><Link className="text-primary-text" href={root+"/offers/"+encodeURIComponent(row.id)}>Offer evidence →</Link>
    <Link className="text-primary-text" href={"/tpo/students/"+encodeURIComponent(row.membershipId)+"/history"}>Learner history →</Link>
    {row.status==="ACCEPTED"?<Link className="text-primary-text" href={root+"/joining"}>Joining tracker →</Link>:null}</div>
   </article>)}</section>}
  <nav aria-label="Offer register pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <span className="text-body">Page {data.page} of {data.totalPages}</span>
   <div className="flex gap-4">{data.page>1?<Link href={root+"/offers?status="+data.status+"&page="+(data.page-1)+searchSuffix} className="font-semibold text-primary-text">← Previous</Link>:null}
    {data.page<data.totalPages?<Link href={root+"/offers?status="+data.status+"&page="+(data.page+1)+searchSuffix} className="font-semibold text-primary-text">Next →</Link>:null}</div>
  </nav>
  <p className="text-xs text-muted-foreground">The CSV includes up to 5,000 matching offer versions, with a truncation row, formula-neutralized fields, learner email, phone and academic identifiers. Counts include all persisted offer versions, not unique learners. Unrecorded joining is pending only on accepted offers.</p>
 </div>;
}
