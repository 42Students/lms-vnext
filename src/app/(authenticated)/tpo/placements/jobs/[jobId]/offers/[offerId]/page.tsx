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
 const facts=[["Current status",data.offer.status],["Issued",data.offer.issued.slice(0,10)],["Response",data.offer.responded?.slice(0,10)??"Not recorded"],["Expiry",data.offer.expires?.slice(0,10)??"Not recorded"],["Joining",data.joining??"Not applicable"]] as const;
 return <div className="min-w-0 space-y-[var(--lms-space-6)]">
  <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline hover:text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] md:min-h-9 print:hidden" href={base+"/offers"}>← Offer register</Link>
  <PageHeader eyebrow="TPO · Offer evidence" title={data.candidate.name+" · "+data.offer.role}
   description="Persisted offer and joining events. Recorded internal reasons are disclosed only within authorized college scope."/>
  <section aria-label="Current offer facts" className="grid min-w-0 grid-cols-1 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] min-[768px]:grid-cols-2 xl:grid-cols-5 print:overflow-visible">
   {facts.map(([name,value])=><div key={name} className="min-w-0 border-b border-[var(--lms-canvas-border)] p-[var(--lms-space-4)] last:border-b-0 min-[768px]:border-r min-[768px]:last:border-r-0 xl:border-b-0">
    <p className="text-xs text-muted-foreground">{name}</p><p className="mt-2 break-words font-semibold">{name==="Current status"?<StatusBadge tone={value==="ACCEPTED"?"success":value==="WITHDRAWN"||value==="DECLINED"?"error":value==="EXPIRED"?"warning":"info"}>{value}</StatusBadge>:value}</p>
   </div>)}
  </section>
  <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline hover:text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] md:min-h-9 print:hidden" href={"/tpo/students/"+encodeURIComponent(data.candidate.membershipId)+"/history"}>Learner placement history →</Link>
  <section aria-label="Offer status and joining history" className="border-b border-border pb-6">
   <h2 className="font-semibold">Recorded transitions</h2>
   {data.events.length===0?<EmptyState title="No persisted status or joining history events were found; absence is not evidence of a decision."/>:
    <ol className="mt-4 divide-y divide-border">{data.events.map(event=><li key={event.id} className="py-4">
     <div className="flex flex-wrap items-center justify-between gap-3">
      <strong className="text-sm">{event.kind}: {event.from??"Initial"} → {event.to}</strong>
      <time dateTime={event.when} className="text-xs text-muted-foreground">{event.when.slice(0,19).replace("T"," ")} UTC</time>
     </div>
     {event.reason?<p className="mt-2 whitespace-pre-wrap text-sm text-body">Recorded reason: {event.reason}</p>:null}
    </li>)}</ol>}
  </section>
  <p className="text-xs text-muted-foreground">This page does not verify letter delivery, external acceptance, or employer confirmation.</p>
 </div>;
}
