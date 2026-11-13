"use client";
import {useState} from "react";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ui/text-link";
import { formatNumberIN } from "@/lib/safe-format";
import { createDateFormatter } from "@/lib/format-date";
import { DEFAULT_TIME_ZONE } from "@/config/locale";
type OfferRow={
 id:string;name:string;membershipId:string;rollNumber:string|null;branch:string|null;
 role:string;status:string;statusLabel:string;kind:string;issued:string;
 responded:string|null;expires:string|null;joining:string|null;
 ruleCheck:string;respondByHours:number|null;annualCtcInr:number|null;
};
type Selection={
 id:string;name:string;roleTitle:string;status:string;offerReady:boolean;
};
const date=(iso:string|null)=>iso?createDateFormatter("en-IN", {
 timeZone:DEFAULT_TIME_ZONE,day:"numeric",month:"short",year:"numeric",
 hour:"numeric",minute:"2-digit",
}).format(new Date(iso))+" IST":"Not recorded";
/** Selected offer receipt summary from the authenticated register plus a
 * separate unissued selection queue; no invented rule-cleared counts,
 * letter uploads, student opening events or release writes. */
export function TpoDriveOffersPrototypeReview({jobId,rows,total,selectedQueue,queueAvailable}:{
 jobId:string;rows:readonly OfferRow[];total:number;
 selectedQueue:readonly Selection[];queueAvailable:boolean;
}){
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const selected=selectedId===null?rows[0]??null:rows.find(row=>row.id===selectedId)??null;
 const root="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 const toCheck=selectedQueue.filter(row=>["SELECTED","VERIFIED"].includes(row.status));
 const ready=toCheck.filter(row=>row.offerReady);
 const needsReview=toCheck.filter(row=>!row.offerReady);
 const issued=rows.filter(row=>row.status==="ISSUED");
 const accepted=rows.filter(row=>row.status==="ACCEPTED");
 return <section aria-label="Drive offer prototype" data-testid="tpo.drive.offers.prototype"
  className="space-y-4">
  <section aria-label="Before students see their offers"
   className="min-w-0 space-y-3 rounded-xl border border-border bg-surface p-4 md:p-5">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
     <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lms-warning-strong)]">
      Step 1 of 2 · Before students see their offers
     </p>
     <Heading level={2} size="lg" className="mt-1 text-foreground">
      {queueAvailable?toCheck.length+" recorded selections await review or release":"Selection queue unavailable"}
     </Heading>
     <p className="mt-1 text-xs leading-5 text-body">
      {queueAvailable?
       ready.length+" preliminarily eligible · "+needsReview.length+" need evidence review. Final held-offer and college-rule checks occur again during confirmed release.":
       "Selection readiness could not be verified. No student has been assumed clear to release."}
     </p>
    </div>
    <ButtonLink variant="secondary" href={root+"/selections"}>
     Review selections and import list
    </ButtonLink>
   </div>
   {queueAvailable&&toCheck.length?<ul className="divide-y divide-border">
    {needsReview.slice(0,5).map(row=><li key={row.id}
      className="flex flex-wrap items-center justify-between gap-3 py-3">
      <span className="min-w-0 text-sm"><strong>{row.name}</strong> · {row.roleTitle}
       <span className="block text-xs text-[color:var(--lms-warning-strong)]">Needs eligibility review · not cleared for release</span>
      </span>
      <TextLink href={root+"/selections"} className="inline-flex min-h-9 items-center text-xs">
       Review in selections
      </TextLink>
     </li>)}
    {ready.length?<li className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
      <strong className="text-[color:var(--lms-success)]">✓ {ready.length} preliminarily eligible</strong>
      <span className="text-xs text-muted-foreground">Still rechecked against current placement rules before issuance</span>
     </li>:null}
   </ul>:queueAvailable?<p role="status" className="text-sm text-muted-foreground">
    No unissued selections are awaiting review. Existing issued offers remain in the register below.
   </p>:null}
   <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
    <ButtonLink variant="primary" href={root+"/selections#selections-release-actions"}>
      Review and confirm release
    </ButtonLink>
    <p className="text-xs text-muted-foreground">
     Nothing is sent from this preview. The release workflow confirms each candidate and records partial failures.
    </p>
   </div>
  </section>
  <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)]">
   <section aria-label="Recorded offer response queue"
    className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface">
    <div className="flex flex-wrap gap-2 border-b border-border p-3 text-xs">
     <span className="rounded-full border border-primary bg-primary-subtle px-3 py-2 font-semibold text-primary-text">On this page · {rows.length}</span>
     <span className="rounded-full border border-border px-3 py-2">Waiting on students · {issued.length}</span>
     <span className="rounded-full border border-border px-3 py-2">Accepted · {accepted.length}</span>
     <span className="rounded-full border border-border px-3 py-2">All matching offer versions · {total}</span>
    </div>
    <div className="min-w-0 overflow-x-auto" role="region" aria-label="Offer versions on this page">
     <Table className="min-w-[512px]">
      <thead className="bg-surface-secondary text-xs uppercase tracking-wide text-muted-foreground">
       <tr><th className="p-3">Student</th><th className="p-3">Offer</th><th className="p-3">Letter / joining</th></tr>
      </thead>
      <tbody className="divide-y divide-border">
       {rows.map(row=><tr key={row.id} className={selected?.id===row.id?"bg-primary-subtle":undefined}>
        <td className="p-3"><Button variant="link" size="inline" type="button" onClick={()=>setSelectedId(row.id)}
         aria-current={selected?.id===row.id?"true":undefined}
         className="text-left">
          {row.name}
         </Button>
         <span className="block break-words text-xs text-muted-foreground">
          {row.rollNumber??"Roll not recorded"} · {row.branch??"Branch not recorded"}
         </span>
        </td>
        <td className="p-3">
         <span className="block font-semibold">{row.statusLabel}</span>
         {row.status==="ISSUED"&&row.expires?<span className="mt-1 block text-xs text-[color:var(--lms-warning-strong)]">Answer by {date(row.expires)}</span>:null}
        </td>
        <td className="p-3 text-xs">{row.joining??"Not recorded"}
         <span className="mt-1 block text-muted-foreground">Letter visibility unavailable in this register</span>
        </td>
       </tr>)}
      </tbody>
     </Table>
     {!rows.length?<p role="status" className="p-4 text-sm text-body">
      No offer versions match the active filters; this does not mean no company selections exist.
     </p>:null}
    </div>
   </section>
   <aside aria-label="Selected offer detail" className="min-w-0 rounded-xl border border-border bg-surface p-4 md:p-5">
    {!selected?<p role="status" className="text-sm text-body">Select an offer version to review its recorded outcomes.</p>:
     <div className="space-y-4">
      <header className="border-b border-border pb-3">
       <Heading level={3} size="lg" className="break-words text-foreground">{selected.name}</Heading>
       <p className="mt-1 text-sm text-body">
        {selected.role} · {selected.annualCtcInr===null?"Package not recorded":"₹"+formatNumberIN((selected.annualCtcInr/100000))+" LPA"}
       </p>
       <p className="mt-2 text-sm font-semibold text-[color:var(--lms-warning-strong)]">
        {selected.status==="ISSUED"?"Waiting on student":
         selected.status==="ACCEPTED"?"Accepted offer":selected.statusLabel}
       </p>
      </header>
      <ol aria-label="Offer timeline" className="space-y-3 border-l-2 border-border pl-4 text-sm">
       <li><strong>Offer record</strong><p className="text-body">{date(selected.issued)}</p></li>
       <li><strong>Response</strong><p className="text-body">{selected.responded?date(selected.responded):"No response recorded"}</p></li>
       <li><strong>Response deadline</strong><p className="text-body">{date(selected.expires)}</p></li>
       <li><strong>Joining</strong><p className="text-body">{selected.joining??"Not recorded"}</p></li>
      </ol>
      <p className="text-xs text-muted-foreground">
       {selected.ruleCheck}. The timeline is persisted evidence, not a delivery or student-open event.
      </p>
      <div className="space-y-2 border-t border-border pt-3">
       <TextLink href={root+"/offers/"+encodeURIComponent(selected.id)}
        className="inline-flex min-h-11 items-center text-sm md:min-h-9">
        Full offer evidence and history
       </TextLink>
       <div><TextLink href={"/tpo/students/"+encodeURIComponent(selected.membershipId)+"/history"}
        className="inline-flex min-h-11 items-center text-sm md:min-h-9">
        Student placement history
       </TextLink></div>
      </div>
     </div>}
   </aside>
  </div>
 </section>;
}
