import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {StatusBadge} from "@/components/ui/status-badge";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoOfferEvidence} from "@/modules/placements/tpo-offer-evidence-service";
import {tpoOfferEvidenceQuery} from "@/modules/placements/tpo-offer-evidence-model";
export default async function TpoOfferEvidencePage({params}:{params:Promise<{jobId:string;offerId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const parsed=tpoOfferEvidenceQuery.safeParse(await params);
 if(!parsed.success)notFound();
 let data:Awaited<ReturnType<typeof getTpoOfferEvidence>>;
 try{data=await getTpoOfferEvidence(context,parsed.data)}catch(e){
  if(e instanceof PlacementsServiceError&&(e.code==="PLACEMENT_OFFER_NOT_FOUND"||e.code==="PLACEMENT_JOB_NOT_FOUND"))notFound();
  throw e;
 }
 const base="/tpo/placements/jobs/"+encodeURIComponent(data.job.id);
 const dateInIst=(value:string)=>new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(new Date(value));
 const momentInIst=(value:string)=>new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(new Date(value))+" IST";
 const facts=[["Current status",data.offer.status],["Issued",dateInIst(data.offer.issued)],["Response",data.offer.responded?dateInIst(data.offer.responded):"Not recorded"],["Expiry",data.offer.expires?dateInIst(data.offer.expires):"Not recorded"],["Joining",data.joining??"Not applicable"]] as const;
 return <div className="min-w-0 space-y-[var(--lms-space-4)]">

  <PageHeader eyebrow="TPO · Offer evidence" title={data.candidate.name+" · "+data.offer.role}
   description="Persisted offer and joining events. Recorded internal reasons are disclosed only within authorized college scope."
   actions={<>
    <Link className="inline-flex min-h-11 items-center w-full justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:w-auto md:min-h-9 print:hidden" href={base+"/offers"}>← Offer register</Link>
    <Link className="inline-flex min-h-11 items-center w-full justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:w-auto md:min-h-9 print:hidden" href={"/tpo/students/"+encodeURIComponent(data.candidate.membershipId)+"/history"}>Learner placement history →</Link>
   </>}/>
  <section aria-label="Current offer facts" className="grid min-w-0 grid-cols-2 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border xl:grid-cols-5 print:overflow-visible">
   {facts.map(([name,value])=><div key={name} className="min-w-0 border-b border-r border-border px-3 py-3 even:border-r-0 last:border-b-0 xl:border-b-0 xl:border-r xl:last:border-r-0">
    <p className="text-xs text-muted-foreground leading-5">{name}</p><p className="mt-2 break-words font-semibold">{name==="Current status"?<StatusBadge tone={value==="ACCEPTED"?"success":value==="DECLINED"?"error":value==="PENDING"?"warning":"neutral"}>{value}</StatusBadge>:value}</p>
   </div>)}
  </section>

  <section aria-label="Offer status and joining history" className="min-w-0 border-b border-border pb-4">
   <h2 className="text-base font-semibold leading-6 text-[var(--lms-heading)]">Recorded transitions</h2>
   {data.events.length===0?<EmptyState title="No persisted status or joining history events were found; absence is not evidence of a decision."/>:
    <ol className="mt-3 divide-y divide-border">{data.events.map(event=><li key={event.id} className="min-w-0 py-4">
     <div className="flex flex-wrap items-center justify-between gap-3">
      <strong className="min-w-0 break-words text-sm">{event.kind}: {event.from??"Initial"} → {event.to}</strong>
      <time dateTime={event.when} className="text-xs text-muted-foreground">{momentInIst(event.when)}</time>
     </div>
     {event.reason?<p className="mt-2 whitespace-pre-wrap break-words text-sm leading-[22px] text-body">Recorded reason: {event.reason}</p>:null}
    </li>)}</ol>}
  </section>
  <p className="text-xs text-muted-foreground leading-5">This page does not verify letter delivery, external acceptance, or employer confirmation.</p>
 </div>;
}
