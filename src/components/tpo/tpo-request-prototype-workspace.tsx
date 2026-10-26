import Link from "next/link";
import {StatusBadge} from "@/components/ui/status-badge";
import {TpoRequestDecisionControl} from "@/components/placements/tpo-request-decision-control";

export type TpoPrototypeRequestRow={
 id:string;studentName:string;rollNumber:string|null;branchName:string|null;
 requestType:string;reason:string;status:string;companyName:string;
 jobTitle:string;requestedAt:Date;updatedAt:Date;urgent:boolean;
 nextRoundAt:Date|null;decidedBy:string|null;decidedAt:Date|null;decisionNote:string|null;
 contextHref:string;contextLabel:string;
};
function label(kind:string){
 return ({
  APPLICATION_WITHDRAWAL:"Withdrawal",OFF_CAMPUS_OFFER:"Off-campus offer",
  ROUND_RESCHEDULE:"Interview reschedule",OFFER_EXTENSION:"Offer extension",
  ABSENCE_DISPUTE:"Absence dispute",CORRECTION_WITH_PROOF:"Correction with proof",
  REGISTRATION_CHANGE:"Registration change",PLACEMENT_AFTER_PLACEMENT:"Placement after placement",
 } as Record<string,string>)[kind]??kind.replaceAll("_"," ").toLowerCase();
}
function when(date:Date){
 return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",
  day:"numeric",month:"short",hour:"numeric",minute:"2-digit"
 }).format(date)+" IST";
}
export function TpoRequestPrototypeWorkspace({rows,selectedId,baseHref,total,pendingTotal}:{
 rows:readonly TpoPrototypeRequestRow[];selectedId:string|null;baseHref:string;
 total:number;pendingTotal:number;
}){
 const selected=selectedId?rows.find(row=>row.id===selectedId)??null:rows[0]??null;
 const href=(id:string)=>baseHref+(baseHref.includes("?")?"&":"?")+"request="+encodeURIComponent(id);
 const pending=rows.filter(row=>row.status==="PENDING").length;
 return <div data-testid="tpo.requests.prototype-workspace" className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
  <aside aria-label="Request queue" className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface">
   <div className="space-y-1 border-b border-border px-4 py-4">
    <h2 className="font-bold text-foreground">{pendingTotal} requests waiting</h2>
    <p className="text-xs text-muted-foreground">
     {total} matching requests across pages · {pending} waiting on the current page
    </p>
    <nav className="mt-3 flex flex-wrap gap-2" aria-label="Request queue filters">
     <Link href="/tpo/requests?status=PENDING" className="rounded-full border border-primary px-3 py-2 text-xs font-semibold text-primary-text">Waiting · {pendingTotal}</Link>
     <Link href="/tpo/requests?status=ALL&age=LAST_30_DAYS" className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-body">Last 30 days</Link>
     <Link href="/tpo/requests?status=ALL" className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-body">All history</Link>
    </nav>
   </div>
   <ul className="divide-y divide-border">
    {rows.map(row=><li key={row.id}>
     <Link href={href(row.id)} aria-current={selected?.id===row.id?"page":undefined}
      className={"block min-h-11 px-4 py-3 hover:bg-primary-subtle "+(selected?.id===row.id?
       "border-l-[3px] border-primary bg-primary-subtle":"")}>
      <span className="flex items-start justify-between gap-2">
       <strong className="break-words text-sm text-foreground">{label(row.requestType)}</strong>
       <span className="shrink-0 text-[11px] text-muted-foreground">{when(row.requestedAt)}</span>
      </span>
      <p className="mt-1 text-sm text-body">{row.studentName} · {row.branchName??"Branch unavailable"}</p>
      <p className="mt-1 break-words text-xs text-muted-foreground">
       {[row.companyName,row.jobTitle].filter(Boolean).join(" · ")||"Not about a particular drive"}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
       {row.urgent?<StatusBadge tone="warning">Urgent</StatusBadge>:null}
       {row.status!=="PENDING"?<StatusBadge tone={row.status==="APPROVED"?"success":row.status==="REJECTED"?"error":"neutral"}>
        {row.status.replaceAll("_"," ").toLowerCase()}</StatusBadge>:null}
      </div>
     </Link>
    </li>)}
   </ul>
   {!rows.length?<p className="p-4 text-sm text-body">No requests on this page.</p>:null}
  </aside>
  <section aria-label="Selected request" className="min-w-0 min-h-[360px] rounded-xl border border-border bg-surface">
   {!selected?<div role="status" className="space-y-2 p-5">
    <h2 className="font-semibold text-foreground">{selectedId?"This request is not on the authorized current page.":"No request selected."}</h2>
    <p className="text-sm text-body">No other student's request has been substituted.</p>
    <Link href={baseHref} className="inline-flex min-h-11 items-center font-semibold text-link underline">
     {selectedId?"Clear request selection":"Return to requests"}
    </Link>
   </div>:<>
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
     <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary-text">{label(selected.requestType)}</p>
      <h2 className="mt-1 text-xl font-bold text-foreground">{selected.studentName}</h2>
      <p className="mt-1 text-sm text-body">{selected.rollNumber??"No roll number"} · {selected.branchName??"Branch unavailable"} · Asked {when(selected.requestedAt)}</p>
     </div>
     {selected.urgent?<StatusBadge tone="warning">Urgent request</StatusBadge>:null}
    </header>
    <div className="grid min-w-0 gap-6 p-5 lg:grid-cols-2">
     <section className="min-w-0 space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Their request</h3>
      <p className="whitespace-pre-wrap break-words rounded-lg bg-surface-secondary p-4 text-sm leading-6 text-foreground">{selected.reason||"No reason recorded."}</p>
      <h3 className="pt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">What you need to decide</h3>
      <dl className="divide-y divide-border text-sm">
       <div className="flex justify-between gap-4 py-2"><dt className="text-body">Drive</dt>
        <dd className="text-right font-semibold text-foreground">{[selected.companyName,selected.jobTitle].filter(Boolean).join(" · ")||"Not tied to a drive"}</dd></div>
       <div className="flex justify-between gap-4 py-2"><dt className="text-body">Next round</dt>
        <dd className="text-right font-semibold text-foreground">{selected.nextRoundAt?when(selected.nextRoundAt):"Not recorded"}</dd></div>
       <div className="flex justify-between gap-4 py-2"><dt className="text-body">Status</dt>
        <dd className="text-right font-semibold text-foreground">{selected.status.replaceAll("_"," ")}</dd></div>
      </dl>
     </section>
     <section className="min-w-0 space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Their record</h3>
      <p className="text-sm text-body">{selected.companyName||"No company recorded"}</p>
      <p className="text-sm font-semibold text-foreground">{selected.jobTitle||"No specific drive"}</p>
      <Link href={selected.contextHref} className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline">
       {selected.contextLabel}
      </Link>
      {selected.status==="PENDING"?<div className="border-t border-border pt-4">
       <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Decision</h3>
       <p className="mb-3 text-xs text-muted-foreground">Approve or reject only after reviewing the request and current drive evidence. Server-side checks still apply.</p>
       <TpoRequestDecisionControl requestId={selected.id}
        expectedUpdatedAt={selected.updatedAt.toISOString()} requestType={selected.requestType}/>
      </div>:<div className="border-t border-border pt-4 text-sm">
       <p className="font-semibold text-foreground">{selected.status.replaceAll("_"," ").toLowerCase()}</p>
       <p className="mt-1 text-body">{selected.decidedBy??"Actor unavailable"} · {selected.decidedAt?when(selected.decidedAt):"Decision date unavailable"}</p>
       {selected.decisionNote?<p className="mt-2 whitespace-pre-wrap break-words text-body">{selected.decisionNote}</p>:null}
      </div>}
     </section>
    </div>
    <footer className="flex flex-wrap justify-between gap-3 border-t border-border p-4">
     <p className="text-xs text-muted-foreground">Selection and decisions use the authorized request record; times are shown in IST.</p>
     <Link href={baseHref} className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline">Back to queue</Link>
    </footer>
   </>}
  </section>
 </div>;
}
