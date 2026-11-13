import { Table } from "@/components/ui/table";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { istIsoDateFormatter } from "@/lib/format-date";
import { createDateFormatter } from "@/lib/format-date";

import { DEFAULT_TIME_ZONE } from "@/config/locale";
export type RoundPreview={
 id:string;sequence:number;name:string;kind:string;status:string;mode:string|null;
 scheduledAt:Date|null;venue:string|null;durationMinutes:number|null;
 participants:readonly {result:{status:string}|null}[];
};
export type SlotPreview={
 id:string;startsAt:string;room:string|null;panel:string|null;
 status:string;applicationId:string|null;
};
type SelectedSlots={
 slots:readonly SlotPreview[];
 roster:readonly {applicationId:string;name:string|null}[];
 reschedules:readonly {id:string;name:string|null;reason:string|null}[];
 pendingProposals:number;
};
const when=(date:Date|string|null)=>date?createDateFormatter("en-IN", {
 timeZone:DEFAULT_TIME_ZONE,day:"numeric",month:"short",hour:"numeric",minute:"2-digit",
 }).format(new Date(date))+" IST":"Not scheduled";
const clock=(at:string)=>createDateFormatter("en-IN", {
 timeZone:DEFAULT_TIME_ZONE,hour:"numeric",minute:"2-digit",
 }).format(new Date(at));
function dateKey(date:Date){
 return istIsoDateFormatter.format(date);
}
/** The original left-rail round overview and right-side real slot evidence.
 * It intentionally does not imply a slot is learner-confirmed just because
 * the booking exists, or invent interviews from a round's participant count. */
export function TpoDriveRoundsPrototypeReview({rounds,selectedId,jobId,slots,now}:{
 rounds:readonly RoundPreview[];selectedId:string|null;jobId:string;
 slots:SelectedSlots|null;now:Date;
}){
 const selected=selectedId?rounds.find(row=>row.id===selectedId)??null:rounds[0]??null;
 const root="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 const roundLink=(id:string)=>root+"/rounds?roundId="+encodeURIComponent(id);
 const selectedSlots=slots?.slots.filter(row=>row.status==="BOOKED")??[];
 const rosterName=new Map((slots?.roster??[]).map(row=>[row.applicationId,row.name]));
 const preview=selectedSlots.slice(0,24);
 return <section data-testid="tpo.drive.rounds.prototype-review" aria-label="Drive round overview"
   className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(240px,330px)_minmax(0,1fr)]">
   <aside className="min-w-0 rounded-xl border border-border bg-surface" aria-label="Drive round stages">
    <ol className="divide-y divide-border">
     {rounds.map(round=>{
      const completed=round.status==="COMPLETED";
      const applied=round.participants.filter(p=>p.result?.status==="APPLIED").length;
      const staged=round.participants.filter(p=>p.result?.status==="STAGED").length;
      return <li key={round.id}>
       <TextLink variant="bare" aria-current={selected?.id===round.id?"page":undefined} href={roundLink(round.id)}
        className={"flex min-h-20 gap-3 px-4 py-3 hover:bg-primary-subtle "+
         (selected?.id===round.id?"border-l-2 border-primary bg-primary-subtle":"")}>
        <span aria-hidden="true" className={"mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold "+
         (completed?"bg-[color:var(--lms-success-surface)] text-[color:var(--lms-success)]":"bg-primary-subtle text-primary-text")}>
         {completed?"✓":round.sequence}
        </span>
        <span className="min-w-0">
         <strong className="block break-words text-sm text-foreground">{round.name}</strong>
         <span className="mt-1 block text-xs text-body">{when(round.scheduledAt)} · {round.venue??"Venue not recorded"}</span>
         <span className="mt-1 block text-xs text-muted-foreground">
          {completed?"Completed":round.status.replaceAll("_"," ")} · {applied} applied results
          {staged?" · "+staged+" staged":""}
         </span>
        </span>
       </TextLink>
      </li>;
     })}
    </ol>
    {!rounds.length?<p role="status" className="p-4 text-sm text-body">No rounds are recorded for this drive.</p>:null}
    <TextLink href={root+"#drive-round-actions"} className="inline-flex min-h-11 w-full items-center justify-center border-t border-border px-4 text-sm">
     Manage or add a round
    </TextLink>
   </aside>
   <article aria-label="Selected round" className="min-w-0 rounded-xl border border-border bg-surface p-4 md:p-5">
    {!selected?<div role="status" className="space-y-3">
     <Heading level={2}>{selectedId?"That round is not in this authorized drive.":"No round selected."}</Heading>
     <p className="text-sm text-body">No other round has been substituted.</p>
     <TextLink className="inline-flex min-h-11 items-center" href={root+"/rounds"}>Reset round selection</TextLink>
    </div>:<div className="space-y-5">
     <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
      <div>
       <Heading level={2} size="xl" className="text-foreground">{selected.name}</Heading>
       <p className="mt-1 text-sm text-body">
        {when(selected.scheduledAt)} · {selected.venue??"Venue not recorded"} · {selected.mode??"Mode not recorded"}
       </p>
      </div>
      <nav aria-label="Selected round actions" className="flex flex-wrap gap-2 text-sm">
       {selected.kind==="INTERVIEW"?<ButtonLink variant="secondary" href={root+"/rounds/"+encodeURIComponent(selected.id)+"/slots"}>Slots</ButtonLink>:null}
       <ButtonLink variant="secondary" href={root+"/rounds/"+encodeURIComponent(selected.id)+"/results"}>Results</ButtonLink>
       <ButtonLink variant="secondary" href={root+"#drive-round-actions"}>Edit</ButtonLink>
      </nav>
     </header>
     {selected.kind==="INTERVIEW"?<section aria-label="Interview slot attention" className="space-y-3">
      {slots===null?<p role="status" className="rounded-lg bg-warning-subtle p-3 text-sm text-body">
       Candidate slot details could not be verified; no slot confirmations are assumed.
       Open Slots to review the live schedule.
      </p>:<>
       <p className="rounded-lg bg-surface-secondary p-3 text-sm">
        <strong>{selectedSlots.length} booked slots</strong> · {slots.reschedules.length} pending requests
        to change a slot · {slots.pendingProposals} recruiter slot proposals.
        Booked does not necessarily mean the student confirmed.
       </p>
       {slots.reschedules.length?<div className="space-y-2">
        <Heading level={3} size="xs" className="uppercase tracking-wide text-muted-foreground">Asked to move</Heading>
        {slots.reschedules.slice(0,6).map(item=><div key={item.id}
           className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning-border bg-warning-subtle px-3 py-2">
          <p className="min-w-0 break-words text-sm"><strong>{item.name?.trim()||"Candidate name unavailable"}</strong> · {item.reason??"No reason recorded"}</p>
          <ButtonLink variant="secondary" href={root+"/rounds/"+encodeURIComponent(selected.id)+"/slots"}>
           Review change
          </ButtonLink>
         </div>)}
        {slots.reschedules.length>6?<p className="text-xs text-body">Showing six of {slots.reschedules.length} pending requests. Open Slots for the rest.</p>:null}
       </div>:null}
       <div>
        <div className="mb-2 flex flex-wrap justify-between gap-3">
         <Heading level={3} size="xs" className="uppercase tracking-wide text-muted-foreground">
          {selected.scheduledAt&&dateKey(selected.scheduledAt)===dateKey(now)?"Today":selected.scheduledAt&&dateKey(selected.scheduledAt)===dateKey(new Date(now.getTime()+86400000))?"Tomorrow":"Current booked slots"}
          {" · "}{selected.durationMinutes?selected.durationMinutes+" min planned round":"Interview round"}
         </Heading>
         <TextLink href={root+"/rounds/"+encodeURIComponent(selected.id)+"/slots"}
          className="text-xs">Change the plan</TextLink>
        </div>
        {preview.length?<div className="min-w-0 overflow-x-auto" role="region" aria-label="Recorded interview timetable">
         <Table className="min-w-[420px]">
          <thead className="bg-surface-secondary text-muted-foreground"><tr>
           <th className="px-3 py-2">Time (IST)</th>
           <th className="px-3 py-2">Candidate</th>
           <th className="px-3 py-2">Panel / room</th>
           <th className="px-3 py-2">Booking</th>
          </tr></thead>
          <tbody className="divide-y divide-border">{preview.map(item=><tr key={item.id}>
           <td className="px-3 py-2 font-semibold">{clock(item.startsAt)}</td>
           <td className="px-3 py-2">{item.applicationId?rosterName.get(item.applicationId)??"Candidate name unavailable":"Unassigned"}</td>
           <td className="px-3 py-2">{[item.panel,item.room].filter(Boolean).join(" · ")||"Not recorded"}</td>
           <td className="px-3 py-2">{item.status==="BOOKED"?"Booked":"Available"}</td>
          </tr>)}</tbody>
         </Table>
         {selectedSlots.length>preview.length?<p className="p-2 text-xs text-body">Previewing {preview.length} of {selectedSlots.length} booked slots. Open the full planner for all rows.</p>:null}
        </div>:<p className="text-sm text-body">No booked candidate slots are recorded for this round.</p>}
       </div>
      </>}
     </section>:<section aria-label="Round results overview">
      <p className="text-sm text-body">{selected.participants.length} candidate entries for this round.</p>
      <p className="mt-1 text-sm text-muted-foreground">For non-interview rounds, use the results workspace to enter and apply the official company outcome.</p>
     </section>}
     <div className="flex flex-wrap gap-3 border-t border-border pt-4 text-sm">
      <TextLink href={root+"/rounds/"+encodeURIComponent(selected.id)+"/results"}
       className="inline-flex min-h-11 items-center md:min-h-9">Review candidate results</TextLink>
      <TextLink href={root+"/candidate-schedule"}
       className="inline-flex min-h-11 items-center md:min-h-9">Review schedule collisions</TextLink>
     </div>
    </div>}
   </article>
 </section>;
}
