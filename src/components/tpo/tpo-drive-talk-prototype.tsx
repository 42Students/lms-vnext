import Link from "next/link";
import {TpoRecruiterMessageReply} from "@/components/tpo/tpo-recruiter-message-reply";

type Thread={
 id:string;recruiterName:string|null;unread:number;count:number;
 lastPreview:string|null;latestAt:Date|null;
 recentMessages:readonly {id:string;senderType:string;body:string;
  createdAt:string;event:string|null}[];
};
type Change={
 id:string;fieldLabel:string;status:string;proposerParty:string;
 proposedValue:string;reason:string|null;createdAt:string;
};
const date=(value:string|Date)=>new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",day:"numeric",month:"short",hour:"numeric",minute:"2-digit",
}).format(new Date(value))+" IST";
function href(base:string,thread:string|null,requestId:string|null){
 const p=new URLSearchParams();
 if(thread)p.set("thread",thread);
 if(requestId)p.set("requestId",requestId);
 const q=p.toString();
 return base+(q?"?"+q:"");
}
/** Original Drive / Talk screenshot. All content is scoped to this persisted
 * drive: recruiter conversation messages are not email receipts, and the
 * separate team channel is NEVER presented as shared with recruiters.
 * Source snippets are bounded at three; full thread remains one click away. */
export function TpoDriveTalkPrototype({threads,selectedId,requestId,changes,changesReady,actorUserId,jobId,quote}:{
 threads:readonly Thread[];selectedId:string|null;requestId:string|null;
 changes:readonly Change[];changesReady:boolean;actorUserId:string;jobId:string;
 quote?:string;
}){
 const root="/tpo/placements/jobs/"+encodeURIComponent(jobId);
 const base=root+"/discussion";
 const selected=selectedId===null?threads[0]??null:threads.find(t=>t.id===selectedId)??null;
 const openChanges=changes.filter(row=>row.status==="OPEN");
 return <section aria-label="Drive Talk" data-testid="tpo.drive.talk.prototype"
   className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(290px,0.8fr)]">
   <div className="min-w-0 rounded-xl border border-border bg-surface">
    <nav aria-label="Drive Talk channels" className="flex flex-wrap items-center gap-2 border-b border-border p-3">
     <span aria-current="page" className="inline-flex min-h-11 items-center rounded-full border border-primary bg-primary-subtle px-3 text-sm font-bold text-primary-text md:min-h-9">
      With recruiters · {threads.reduce((sum,t)=>sum+t.unread,0)} unread
     </span>
     <Link href="/tpo/team?filter=drives"
       className="inline-flex min-h-11 items-center rounded-full border border-border px-3 text-sm font-semibold text-body md:min-h-9">
      Your team only
     </Link>
     <p className="text-xs text-muted-foreground md:ml-auto">Recruiters cannot see your team-only conversation.</p>
    </nav>
    {threads.length>1?<nav aria-label="Choose recruiter conversation"
      className="flex flex-wrap gap-2 border-b border-border p-3">
     {threads.map(thread=><Link key={thread.id} href={href(base,thread.id,requestId)}
       aria-current={selected?.id===thread.id?"page":undefined}
       className={"inline-flex min-h-11 items-center rounded-full border px-3 text-xs font-semibold md:min-h-9 "+
        (selected?.id===thread.id?"border-primary bg-primary-subtle text-primary-text":"border-border text-body")}>
       {thread.recruiterName?.trim()||"Recruiter"} {thread.unread>0?" · "+thread.unread+" unread":""}
      </Link>)}
    </nav>:null}
    {!selected?<div role="status" className="space-y-2 p-5">
     <h2 className="font-semibold text-foreground">{selectedId?"This recruiter thread is not in this authorized drive.":"No recruiter conversation recorded yet."}</h2>
     <p className="text-sm text-body">{selectedId?"No other recruiter conversation has been substituted.":"Open Messages to begin a conversation with an authorized recruiter."}</p>
     <Link href={selectedId?base:"/tpo/messages"} className="inline-flex min-h-11 items-center font-semibold text-link underline">
      {selectedId?"Reset selected thread":"Open Recruiter Messages"}
     </Link>
    </div>:<div className="space-y-4 px-4 py-5">
     <div className="flex flex-wrap justify-between gap-2">
      <h2 className="text-lg font-bold text-foreground">With {selected.recruiterName?.trim()||"recruiter"}</h2>
      <Link href={"/tpo/messages/"+encodeURIComponent(selected.id)} className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">
       Open full conversation
      </Link>
     </div>
     <p className="text-xs text-muted-foreground">
      {selected.count} recorded message(s) · {selected.unread} unread recruiter message(s).
      Latest three are shown; read and reply in the full conversation for complete history.
     </p>
     <div aria-label="Recent recruiter conversation" className="min-w-0 space-y-4">
      {selected.recentMessages.map(message=>{
       const recruiter=message.senderType==="RECRUITER";
       return <article key={message.id} className={"flex "+(recruiter?"justify-start":"justify-end")}>
        <div className={"max-w-[90%] min-w-0 rounded-xl px-4 py-3 text-sm "+
         (recruiter?"bg-surface-secondary text-foreground":"bg-primary-subtle text-foreground")}>
         <p className="whitespace-pre-wrap break-words leading-6">
          {message.body.length>2000?message.body.slice(0,2000)+"…":message.body}
         </p>
         {message.event?<p className="mt-2 text-xs text-muted-foreground">{message.event.replaceAll("_"," ")}</p>:null}
         <p className="mt-2 text-right text-[11px] text-muted-foreground">
          {recruiter?selected.recruiterName??"Recruiter":"Placement team"} · {date(message.createdAt)}
         </p>
        </div>
       </article>;
      })}
      {!selected.recentMessages.length?<p role="status" className="p-3 text-sm text-body">
       There are no saved messages in this conversation yet.
      </p>:null}
     </div>
     {quote?<div role="status" className="rounded-lg border border-warning-border bg-warning-subtle p-3 text-sm">
      You opened this conversation from a persisted change request.
      Use “Quote change request” below to insert its context into your unsent message.
     </div>:null}
     <TpoRecruiterMessageReply threadId={selected.id} unread={selected.unread>0}
      actorUserId={actorUserId} {...(quote===undefined?{}:{quote})}/>
     <p className="text-xs text-muted-foreground">A reply here is a recruiter thread message, not a sent email or a team-only note.</p>
    </div>}
   </div>
   <aside aria-label="Drive participants and change history" className="min-w-0 space-y-4">
    <section className="rounded-xl border border-border bg-surface p-4">
     <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Recruiter conversations on this drive</h2>
     <ul className="mt-3 divide-y divide-border">
      {threads.slice(0,10).map(thread=><li key={thread.id} className="py-2">
       <Link href={href(base,thread.id,null)} className="min-h-11 inline-flex items-center text-sm font-semibold text-link underline md:min-h-9">
        {thread.recruiterName?.trim()||"Recruiter"}
       </Link>
       <p className="text-xs text-muted-foreground">
        {thread.count} recorded messages · {thread.unread} unread
       </p>
      </li>)}
     </ul>
     {threads.length>10?<p className="text-xs text-muted-foreground">
      Showing ten of {threads.length} recruiter conversations on this drive.
     </p>:null}
     <p className="mt-2 text-xs text-muted-foreground">
      This is a conversation list, not the full company access-grant roster.
     </p>
    </section>
    <section className="rounded-xl border border-border bg-surface p-4">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
       Changes on this drive
      </h2>
      <Link href={root+"/change-requests"} className="text-xs font-semibold text-link underline">All changes</Link>
     </div>
     {!changesReady?<p role="status" className="mt-2 text-sm text-body">
      Change requests could not be verified. No request is assumed missing.
     </p>:changes.length?<ul className="mt-3 divide-y divide-border">
      {changes.slice(0,5).map(item=><li key={item.id} className="py-3">
       <p className="text-sm font-semibold text-foreground">{item.fieldLabel}</p>
       <p className="mt-1 break-words text-xs text-body">
        {item.proposedValue||item.reason||"No change details recorded"}
       </p>
       <p className="mt-1 text-xs text-muted-foreground">
        {item.status.replaceAll("_"," ")} · {date(item.createdAt)}
       </p>
       <Link href={root+"/change-requests#change-request-"+encodeURIComponent(item.id)}
        className="inline-flex min-h-9 items-center text-xs font-semibold text-link underline">
        {item.status==="OPEN"?"Review and answer":"View decision"}
       </Link>
       {item.status==="OPEN"&&selected?<Link href={href(base,selected.id,item.id)}
        className="ml-3 inline-flex min-h-9 items-center text-xs font-semibold text-link underline">
        Reply first
       </Link>:null}
      </li>)}
      </ul>:<p role="status" className="mt-2 text-sm text-body">
       No recorded drive change requests in the retrieved history.
      </p>}
     {changesReady&&openChanges.length>5?<p className="text-xs text-muted-foreground">
      Further open requests may be lower in the list. Open All changes to review.
     </p>:null}
     <p className="mt-2 text-xs text-muted-foreground">
      Change requests are actioned in their own audited workflow. A chat reply does not apply a requested change.
     </p>
    </section>
   </aside>
 </section>;
}
