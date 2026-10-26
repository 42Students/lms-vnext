import Link from "next/link";

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
 reschedules:readonly {id:string;name:string;reason:string|null}[];
 pendingProposals:number;
};
const when=(date:Date|string|null)=>date?new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",day:"numeric",month:"short",hour:"numeric",minute:"2-digit",
 }).format(new Date(date))+" IST":"Not scheduled";
const clock=(at:string)=>new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",
 }).format(new Date(at));
function dateKey(date:Date){
 return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",
  year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
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
       <Link aria-current={selected?.id===round.id?"page":undefined} href={roundLink(round.id)}
        className={"flex min-h-20 gap-3 px-4 py-3 hover:bg-primary-subtle "+
         (selected?.id===round.id?"border-l-[3px] border-primary bg-primary-subtle":"")}>
        <span aria-hidden="true" className={"mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold "+
         (completed?"bg-emerald-50 text-emerald-800":"bg-primary-subtle text-primary-text")}>
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
       </Link>
      </li>;
     })}
    </ol>
    {!rounds.length?<p role="status" className="p-4 text-sm text-body">No rounds are recorded for this drive.</p>:null}
    <Link href={root+"#drive-round-actions"} className="inline-flex min-h-11 w-full items-center justify-center border-t border-border px-4 text-sm font-semibold text-link underline">
     Manage or add a round
    </Link>
   </aside>
   <article aria-label="Selected round" className="min-w-0 rounded-xl border border-border bg-surface p-4 md:p-5">
    {!selected?<div role="status" className="space-y-3">
     <h2 className="font-semibold">{selectedId?"That round is not in this authorized drive.":"No round selected."}</h2>
     <p className="text-sm text-body">No other round has been substituted.</p>
     <Link className="inline-flex min-h-11 items-center text-link underline" href={root+"/rounds"}>Reset round selection</Link>
    </div>:<div className="space-y-5">
     <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
      <div>
       <h2 className="text-xl font-bold text-foreground">{selected.name}</h2>
       <p className="mt-1 text-sm text-body">
        {when(selected.scheduledAt)} · {selected.venue??"Venue not recorded"} · {selected.mode??"Mode not recorded"}
       </p>
      </div>
      <nav aria-label="Selected round actions" className="flex flex-wrap gap-2 text-sm">
       {selected.kind==="INTERVIEW"?<Link href={root+"/rounds/"+encodeURIComponent(selected.id)+"/slots"}
         className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 font-semibold text-link md:min-h-9">Slots</Link>:null}
       <Link href={root+"/rounds/"+encodeURIComponent(selected.id)+"/results"}
        className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 font-semibold text-link md:min-h-9">Results</Link>
       <Link href={root+"#drive-round-actions"}
        className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 font-semibold text-link md:min-h-9">Edit</Link>
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
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Asked to move</h3>
        {slots.reschedules.slice(0,6).map(item=><div key={item.id}
           className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning-border bg-warning-subtle px-3 py-2">
          <p className="min-w-0 break-words text-sm"><strong>{item.name}</strong> · {item.reason??"No reason recorded"}</p>
          <Link href={root+"/rounds/"+encodeURIComponent(selected.id)+"/slots"}
           className="inline-flex min-h-9 items-center rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-link">
           Review change
          </Link>
         </div>)}
        {slots.reschedules.length>6?<p className="text-xs text-body">Showing six of {slots.reschedules.length} pending requests. Open Slots for the rest.</p>:null}
       </div>:null}
       <div>
        <div className="mb-2 flex flex-wrap justify-between gap-3">
         <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {selected.scheduledAt&&dateKey(selected.scheduledAt)===dateKey(now)?"Today":selected.scheduledAt&&dateKey(selected.scheduledAt)===dateKey(new Date(now.getTime()+86400000))?"Tomorrow":"Current booked slots"}
          {" · "}{selected.durationMinutes?selected.durationMinutes+" min planned round":"Interview round"}
         </h3>
         <Link href={root+"/rounds/"+encodeURIComponent(selected.id)+"/slots"}
          className="text-xs font-semibold text-link underline">Change the plan</Link>
        </div>
        {preview.length?<div className="min-w-0 overflow-x-auto" role="region" aria-label="Recorded interview timetable">
         <table className="w-full min-w-[420px] border-collapse text-left text-xs">
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
         </table>
         {selectedSlots.length>preview.length?<p className="p-2 text-xs text-body">Previewing {preview.length} of {selectedSlots.length} booked slots. Open the full planner for all rows.</p>:null}
        </div>:<p className="text-sm text-body">No booked candidate slots are recorded for this round.</p>}
       </div>
      </>}
     </section>:<section aria-label="Round results overview">
      <p className="text-sm text-body">{selected.participants.length} candidate entries for this round.</p>
      <p className="mt-1 text-sm text-muted-foreground">For non-interview rounds, use the results workspace to enter and apply the official company outcome.</p>
     </section>}
     <div className="flex flex-wrap gap-3 border-t border-border pt-4 text-sm">
      <Link href={root+"/rounds/"+encodeURIComponent(selected.id)+"/results"}
       className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Review candidate results</Link>
      <Link href={root+"/candidate-schedule"}
       className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Review schedule collisions</Link>
     </div>
    </div>}
   </article>
 </section>;
}
