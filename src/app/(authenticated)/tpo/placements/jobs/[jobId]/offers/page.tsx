import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoDriveOfferRegister} from "@/modules/placements/tpo-drive-offer-register-service";
import {getTpoSelectionWorkspace} from "@/modules/placements/tpo-drive-selection-service";
import {TpoDriveOffersPrototypeReview} from "@/components/tpo/tpo-drive-offers-prototype-review";
import {AuthorizationError} from "@/modules/permissions/policy";
import {offerRegisterQuery} from "@/modules/placements/tpo-drive-offer-register-model";
import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Tabs} from "@/components/ui/tabs";
import {Pagination} from "@/components/ui/pagination";
import {EmptyState} from "@/components/ui/empty-state";
import {Banner} from "@/components/ui/banner";
import {StatusBadge} from "@/components/ui/status-badge";
export default async function OffersPage({params,searchParams}:{params:Promise<{jobId:string}>,searchParams:Promise<{status?:string|string[];page?:string|string[];q?:string|string[];joining?:string|string[];kind?:string|string[];expiry?:string|string[];minCtcLpa?:string|string[];maxCtcLpa?:string|string[]}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const [p,q]=await Promise.all([params,searchParams]);
 if(tpoReportHasAmbiguousFilters(q)||Object.prototype.hasOwnProperty.call(q,"jobId"))return <TpoReportInvalidFilters path={"/tpo/placements/jobs/"+encodeURIComponent(p.jobId)+"/offers"}/>;
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
 const selections=await getTpoSelectionWorkspace(context,p.jobId)
  .catch(e=>{if(e instanceof AuthorizationError)throw e;return null;});
 const formatIst=(iso:string|null)=>iso?new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(iso))+" IST":"Not recorded";
 const root="/tpo/placements/jobs/"+encodeURIComponent(data.job.id);
 const searchQuery=parsed.data.q;
 const searchSuffix=(searchQuery?"&q="+encodeURIComponent(searchQuery):"")+(parsed.data.joining!=="ALL"?"&joining="+parsed.data.joining:"")+(parsed.data.kind!=="ALL"?"&kind="+parsed.data.kind:"")+(parsed.data.expiry!=="ALL"?"&expiry="+parsed.data.expiry:"")+(parsed.data.minCtcLpa!==undefined?"&minCtcLpa="+parsed.data.minCtcLpa:"")+(parsed.data.maxCtcLpa!==undefined?"&maxCtcLpa="+parsed.data.maxCtcLpa:"");
 const csvFilters=new URLSearchParams({status:data.status,joining:parsed.data.joining,kind:parsed.data.kind,expiry:parsed.data.expiry});
 if(searchQuery)csvFilters.set("q",searchQuery);
 if(parsed.data.minCtcLpa!==undefined)csvFilters.set("minCtcLpa",String(parsed.data.minCtcLpa));
 if(parsed.data.maxCtcLpa!==undefined)csvFilters.set("maxCtcLpa",String(parsed.data.maxCtcLpa));
 const csvHref="/api/placements/tpo/jobs/"+encodeURIComponent(data.job.id)+"/offers/export?"+csvFilters.toString();
 const tabs=[["ALL","All",data.counts.all],["ISSUED","Issued",data.counts.issued],["ACCEPTED","Accepted",data.counts.accepted],["DECLINED","Declined",data.counts.declined],["WITHDRAWN","Withdrawn",data.counts.withdrawn],["EXPIRED","Expired",data.counts.expired]] as const;
 return <div className="min-w-0 space-y-[var(--lms-space-4)]">

  <PageHeader eyebrow="TPO · Offers" title={data.job.title+" · Offer register"} description="Persisted offer versions and recorded joining outcomes; screening results are not employer selection."
   actions={<>
    <Link href={root} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-link-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:w-auto md:min-h-9">← Back to drive</Link>
    <a href={csvHref} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:w-auto md:min-h-9">Export filtered CSV</a>
   </>}/>
  <Banner tone="info">Students see an offer only when you release it. The respond-by time is at least 48 hours and never ends on a Sunday or holiday.</Banner>
  <TpoDriveOffersPrototypeReview jobId={data.job.id} rows={data.rows}
   total={data.totalMatching} queueAvailable={selections!==null}
   selectedQueue={selections?.selections.map(row=>({
    id:row.id,name:row.name,roleTitle:row.roleTitle,status:row.status,offerReady:row.offerReady,
   }))??[]}/>

  <Tabs ariaLabel="Offer status" renderPanel={false} value={data.status}
    items={tabs.map(([value,label,count])=>({
      value,label,count,href:root+"/offers?status="+value+searchSuffix,
    }))}/>
  <form method="get" action={root+"/offers"} className="min-w-0 space-y-3 border-b border-border pb-4" aria-label="Filter offers">
   <Input type="hidden" name="status" value={data.status}/>
   <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
   <label className="grid min-w-0 flex-1 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search learner, email, roll, batch, branch or role
    <Input type="search" name="q" maxLength={100} defaultValue={searchQuery} placeholder="Name or offer role" className="w-full min-w-0"/>
   </label><Button type="submit" className="min-h-11 w-full px-6 sm:w-auto md:min-h-9">Search</Button>
   {searchQuery||parsed.data.joining!=="ALL"||parsed.data.kind!=="ALL"||parsed.data.expiry!=="ALL"||parsed.data.minCtcLpa!==undefined||parsed.data.maxCtcLpa!==undefined?<Link href={root+"/offers?status="+data.status} className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-link hover:underline sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear filters</Link>:null}
   </div>
   <details className="group min-w-0 border-t border-border pt-3">
    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-[var(--lms-control-radius)] px-2 text-sm font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] [&::-webkit-details-marker]:hidden">
      Filters <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span>
    </summary>
    <div className="grid min-w-0 gap-3 pt-3 sm:grid-cols-2 xl:grid-cols-3">
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Joining outcome
    <Select name="joining" defaultValue={parsed.data.joining} >
     <option value="ALL">All joining outcomes</option><option value="PENDING">Accepted / pending</option>
     <option value="JOINED">Confirmed joined</option><option value="DEFERRED">Deferred</option>
     <option value="DID_NOT_JOIN">Did not join</option>
    </Select>
   </label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Offer type
    <Select name="kind" defaultValue={parsed.data.kind} >
     <option value="ALL">All kinds</option><option value="OFFER">Offer</option><option value="LOI">Letter of intent</option>
    </Select>
   </label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Response deadline
    <Select name="expiry" defaultValue={parsed.data.expiry}
      >
     <option value="ALL">Any response deadline</option>
     <option value="DUE_SOON">Due within 7 days</option>
     <option value="EXPIRED">Time is up</option>
     <option value="OPEN">More than 7 days left</option>
     <option value="UNKNOWN">No expiry recorded</option>
    </Select>
   </label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Minimum package (LPA)
    <Input type="number" name="minCtcLpa" min={0} max={1000} step="0.01"
      defaultValue={parsed.data.minCtcLpa??""}
      className="w-full md:w-36"/>
   </label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Maximum package (LPA)
    <Input type="number" name="maxCtcLpa" min={0} max={1000} step="0.01"
      defaultValue={parsed.data.maxCtcLpa??""}
      className="w-full md:w-36"/>
   </label>
    </div>
   </details>
  </form>
  <p role="status" className="text-sm text-body leading-[1.6]">Showing {data.totalMatching===0?0:(data.page-1)*data.pageSize+1}–{Math.min(data.totalMatching,data.page*data.pageSize)} of {data.totalMatching} matching offer versions. Page {data.page} of {data.totalPages}.</p>
  {data.rows.length===0?<EmptyState title="No offers match this filter."/>:
   <section aria-label="Recorded offers" className="min-w-0 divide-y divide-border border-y border-border">{data.rows.map(row=><article key={row.id} className="min-w-0 py-4">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><h2 className="break-words text-base font-semibold leading-6 text-foreground">{row.name}</h2><p className="break-words text-sm text-body">{row.role} · {row.kind==="LOI"?"Letter of intent":"Offer"} · {row.annualCtcInr==null?"Pay not recorded":"₹"+(row.annualCtcInr/100000).toLocaleString("en-IN")+" LPA"}</p><p className="mt-1 text-xs text-body">Roll: {row.rollNumber??"Not recorded"} · Batch: {row.batch??"Not recorded"} · Branch: {row.branch??"Not recorded"}</p></div><StatusBadge tone={row.status==="ACCEPTED"?"success":row.status==="DECLINED"?"error":row.status==="PENDING"?"warning":"neutral"}>{row.status}</StatusBadge></div>
    <div className="mt-3 grid min-w-0 gap-3 text-sm sm:grid-cols-3">
      <div className="min-w-0"><p className="text-xs text-muted-foreground">Issued</p><p className="mt-1 break-words text-body">{formatIst(row.issued)}</p></div>
      <div className="min-w-0"><p className="text-xs text-muted-foreground">Offer expiry</p><p className="mt-1 break-words text-body">{formatIst(row.expires)}</p></div>
      <div className="min-w-0"><p className="text-xs text-muted-foreground">Joining</p><p className="mt-1 break-words text-body">{row.joining??"Not applicable"}</p></div>
    </div>
    <div className="mt-3 flex min-w-0 flex-wrap gap-2"><Link className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 sm:w-auto text-[var(--lms-link-text)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={root+"/offers/"+encodeURIComponent(row.id)}>Offer evidence →</Link></div>
    <details className="group mt-3 min-w-0 border-t border-border pt-2">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] [&::-webkit-details-marker]:hidden">
        More offer details <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span>
      </summary>
      <div className="min-w-0 space-y-3 pb-2">
    <p className="mt-2 text-xs text-body">Fixed: {row.fixedLpa===null?"Not recorded":row.fixedLpa+" LPA"} · Variable: {row.variableLpa===null?"Not recorded":row.variableLpa+" LPA"} · Joining bonus: {row.joiningBonusLpa===null?"Not recorded":row.joiningBonusLpa+" LPA"} · Bond: {row.bondMonths===null?"Not recorded":row.bondMonths+" months"}</p>
    {row.acceptanceChannel?<p className="mt-1 text-xs text-body">
      Acceptance evidence: {row.acceptanceChannel}
      {row.acceptedDisputableUntil?" · Dispute window until "+formatIst(row.acceptedDisputableUntil):""}
    </p>:null}
    <dl className="mt-3 grid min-w-0 gap-[var(--lms-space-3)] text-sm min-[768px]:grid-cols-3"><div><dt>Issued</dt><dd><time dateTime={row.issued}>{formatIst(row.issued)}</time></dd></div><div><dt>Responded</dt><dd>{row.responded?<time dateTime={row.responded}>{formatIst(row.responded)}</time>:"Not recorded"}</dd></div><div><dt>Joining</dt><dd>{row.joining??"Not applicable"}</dd></div>
    <div><dt>Offer expiry</dt><dd>{row.expires?<time dateTime={row.expires}>{formatIst(row.expires)}</time>:"Not recorded"}</dd></div><div><dt>Respond by</dt><dd>{row.respondByHours===null?"Not applicable":row.respondByHours===0?"Time is up":row.respondByHours+" h left"}</dd></div>
    <div><dt>Email</dt><dd>{row.email??"Not recorded"}</dd></div><div><dt>Phone</dt><dd>{row.phone??"Not recorded"}</dd></div><div><dt>Rules check</dt><dd title="Offer state only; consult the college placement rules for eligibility and held-offer limits.">{row.ruleCheck}</dd></div>
    {row.expiryIndicator!=="NOT_APPLICABLE"?<div><dt>Issued-offer expiry state</dt><dd>{row.expiryIndicator.replaceAll("_"," ").toLowerCase()}</dd></div>:null}</dl>
        <div className="flex min-w-0 flex-wrap gap-4 text-sm font-semibold">
    <Link className="inline-flex min-h-11 items-center text-[var(--lms-link-text)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={"/tpo/students/"+encodeURIComponent(row.membershipId)+"/history"}>Learner history →</Link>
    {row.status==="ACCEPTED"?<Link className="inline-flex min-h-11 items-center text-[var(--lms-link-text)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={root+"/joining"}>Joining tracker →</Link>:null}</div>
      </div>
    </details>

   </article>)}</section>}
  <Pagination label="Offer register pages" page={data.page} pageCount={data.totalPages}
    hrefForPage={target=>root+"/offers?status="+data.status+"&page="+target+searchSuffix}/>
  <p className="text-xs text-muted-foreground">The CSV includes up to 5,000 matching offer versions, with a truncation row, formula-neutralized fields, learner email, phone and academic identifiers. Counts include all persisted offer versions, not unique learners. Unrecorded joining is pending only on accepted offers.</p>
 </div>;
}
