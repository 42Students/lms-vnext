import {Input} from "@/components/ui/input";
import {RecruiterConversationReplyForm} from "./recruiter-conversation-reply-form";
import {RecruiterConversationReadControl} from "./recruiter-conversation-read-control";
import {RecruiterConversationLiveRefresh} from "./recruiter-conversation-live-refresh";
import type {readRecruiterThreadMessages} from "@/modules/placements/tpo-messaging-service";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { createDateFormatter } from "@/lib/format-date";

type InboxRow={id:string;jobId:string|null;jobTitle:string;unread:number;
 preview:{text:string}|null;lastMessageAt:Date|null;createdAt:Date};
type History=Awaited<ReturnType<typeof readRecruiterThreadMessages>>;
type DecisionNotice={id:string;title:string;body:string;createdAt:Date;href:string;unread:boolean};
type Props={collegeId:string;choices:readonly {collegeId:string;collegeName:string}[];rows:readonly InboxRow[];selected:InboxRow|null;history:History|null;
 selectedHistoryUnavailable:boolean;generalPreviewUnavailable:boolean;
 decisionNoticesUnavailable:boolean;decisionNotices:readonly DecisionNotice[];
 q:string;total:number;pages:number;unreadTotal:number};
const formatted=(value:Date)=>createDateFormatter("en-IN", {
 timeZone:"Asia/Kolkata",day:"numeric",month:"short",hour:"numeric",minute:"2-digit",
 hour12:true,
}).format(value);
export function RecruiterConversationWorkspace({
 collegeId,choices,rows,selected,history,selectedHistoryUnavailable,
 generalPreviewUnavailable,decisionNoticesUnavailable,decisionNotices,q,total,pages,unreadTotal,
}:Props){
 const base="/hr/conversations?collegeId="+encodeURIComponent(collegeId);
 return <main data-testid="recruiter.messages.workspace" className="min-w-0 space-y-4">
  <RecruiterConversationLiveRefresh collegeId={collegeId} threadId={selected?.id}/>
  <header className="flex flex-wrap items-end justify-between gap-3">
   <Heading level={1} size="2xl" className="text-foreground">Messages</Heading>
   <p className="text-sm text-muted-foreground">
    With your college placement cell · {unreadTotal} unread message{unreadTotal===1?"":"s"}
   </p>
  </header>
  <div className="flex flex-wrap items-center justify-between gap-3">
   <p className="text-sm text-body">Conversations with the placement cell, one per hiring drive, plus a general conversation.</p>
   <TextLink href="/hr/notifications" className="inline-flex min-h-11 items-center">Notification inbox</TextLink>
  </div>
  {choices.length>1?<nav aria-label="Choose college messages" className="flex flex-wrap items-center gap-2">
   <span className="text-xs font-semibold text-muted-foreground">College</span>
   {choices.map(item=><TextLink variant="bare" key={item.collegeId}
    href={"/hr/conversations?collegeId="+encodeURIComponent(item.collegeId)}
    aria-current={item.collegeId===collegeId?"page":undefined}
    className={"inline-flex min-h-11 items-center rounded-lg border px-3 py-2 text-sm font-semibold "+
     (item.collegeId===collegeId?"border-primary bg-primary-subtle text-foreground":"border-border text-primary-text")}>
    {item.collegeName}
   </TextLink>)}
  </nav>:null}
  {generalPreviewUnavailable?<p role="status" className="rounded-lg border border-border p-3 text-sm text-body">
   General conversation preview is temporarily unavailable. Refresh to try again; existing conversations remain accessible after access is verified.
  </p>:null}
  {decisionNoticesUnavailable?<p role="status" className="rounded-lg border border-border p-3 text-sm text-body">
   Drive request decisions are temporarily unavailable. Conversations are still accessible; refresh to try again.
  </p>:null}
  {decisionNotices.length?<Disclosure title="Drive request decisions">
   <ul className="divide-y divide-border">{decisionNotices.map(item=><li key={item.id} className="py-3">
    <strong className="block text-sm text-foreground">{item.title}{item.unread?" · New":""}</strong>
    <p className="whitespace-pre-wrap break-words text-sm text-body">{item.body}</p>
    <TextLink href={item.href} className="inline-flex min-h-11 items-center text-sm">View your drive request</TextLink>
   </li>)}</ul>
  </Disclosure>:null}
  <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(240px,290px)_minmax(0,1fr)]">
   <aside aria-label="Conversation inbox" className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface">
    <form method="get" action="/hr/conversations" role="search" className="space-y-2 border-b border-border p-3">
     <input type="hidden" name="collegeId" value={collegeId}/>
     <Label htmlFor="recruiter-message-search" className="sr-only">Search by drive or message</Label>
     <Input id="recruiter-message-search" name="q" type="search"
      defaultValue={q} maxLength={120} placeholder="Search by drive or message"/>
     <div className="flex justify-between gap-3 text-xs">
      <Button variant="link" size="inline" type="submit">Search</Button>
      {q?<TextLink href={base} className="inline-flex min-h-9 items-center">Clear</TextLink>:null}
     </div>
    </form>
    <nav aria-label="Authorized conversations" className="max-h-[55vh] overflow-y-auto lg:max-h-[38rem]">
     {rows.length?<ol className="divide-y divide-border">
      {rows.map(row=><li key={row.id}><TextLink variant="bare"
       href={base+"&thread="+encodeURIComponent(row.id)+(q?"&q="+encodeURIComponent(q):"")}
       aria-current={row.id===selected?.id?"page":undefined}
       className={"flex min-h-16 items-start gap-2 border-l-2 px-3 py-3 hover:bg-surface-secondary focus-ring-inset "+
        (row.id===selected?.id?"border-primary bg-primary-subtle":"border-transparent")}>
       <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm text-foreground">{row.jobId?row.jobTitle:"General"}</strong>
        <span className="mt-1 block truncate text-xs text-muted-foreground">{row.preview?.text??"No messages yet"}</span>
       </span>
       {row.unread>0?<span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--lms-error)] px-1 text-xs font-bold text-on-primary"
        aria-label={row.unread+" unread messages"}>{row.unread}</span>:null}
      </TextLink></li>)}
     </ol>:<p className="p-4 text-sm text-muted-foreground">{q?
      "No conversations match your search.":"No messages yet. Open a drive to start a discussion."}</p>}
    </nav>
    <div className="flex flex-wrap justify-between gap-2 border-t border-border p-3 text-xs">
     <span>{total} conversations{pages>1?" · more pages":""}</span>
     <TextLink href={base+"&view=advanced"}>Advanced inbox</TextLink>
    </div>
   </aside>
   <section aria-label="Selected conversation" className="flex min-h-[30rem] min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface">
    {selected?<><header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
     <div className="min-w-0">
      <Heading level={2} size="lg" className="break-words text-foreground">{selected.jobId?selected.jobTitle:"General"}</Heading>
      <p className="text-xs text-muted-foreground">{selected.jobId?"Hiring drive":"General"} · Placement cell</p>
     </div>
     <ButtonLink variant="secondary" href={selected.jobId?"/recruiter/drives/"+encodeURIComponent(selected.jobId)+"?tab=discussion":
      "/hr/conversations/"+encodeURIComponent(selected.id)}>
      {selected.jobId?"Open the drive":"Open full history"}
     </ButtonLink>
    </header>
    {selectedHistoryUnavailable?<div role="alert" className="p-4 text-sm text-body">
      Conversation history is temporarily unavailable. No reply will be sent until it is verified.
      <TextLink href={base+"&thread="+encodeURIComponent(selected.id)} className="ml-2">Retry</TextLink>
     </div>:<>
      <ol aria-label="Conversation messages" className="flex max-h-[46vh] min-h-[16rem] flex-1 flex-col gap-4 overflow-y-auto p-4">
       {history&&history.messages.length?history.messages.map(message=>
        <li key={message.id} className={"max-w-[90%] rounded-xl px-4 py-3 text-sm "+
         (message.senderType==="RECRUITER"?"self-end bg-primary-subtle":"self-start bg-surface-secondary")}>
         <p className="whitespace-pre-wrap break-words text-foreground">{message.body}</p>
         <p className="mt-2 text-right text-xs text-muted-foreground">
          {message.senderType==="RECRUITER"?"You":message.senderDisplayName??"Placement cell"} · {formatted(message.createdAt)} IST
         </p>
        </li>):<li className="text-sm text-muted-foreground">No messages yet.</li>}
      </ol>
      {history&&history.pages>1?<TextLink href={"/hr/conversations/"+encodeURIComponent(selected.id)}
       className="mx-4 inline-flex min-h-9 items-center text-xs">
       Browse all {history.total} messages</TextLink>:null}
      {history&&history.unread>0?<div className="mx-4 mb-2"><RecruiterConversationReadControl threadId={selected.id}/></div>:null}
      <div className="mt-auto border-t border-border p-4">
       <RecruiterConversationReplyForm threadId={selected.id} historyAvailable={Boolean(history)}/>
      </div>
    </>}</>:<div className="space-y-4 p-6">
     <p className="text-sm text-muted-foreground">{generalPreviewUnavailable?
    "Access could not be reconfirmed; no conversation will be opened. Refresh to retry.":
    "Start a general conversation with the placement cell, or open a drive to discuss its hiring process."}</p>
     {!q&&!generalPreviewUnavailable?<form method="post" action="/api/placements/recruiter/conversations/open">
       <input type="hidden" name="collegeId" value={collegeId}/>
       <Button variant="primary" size="md" type="submit">
        Open general conversation
       </Button>
     </form>:<TextLink href={base} className="inline-flex min-h-11 items-center">Clear search</TextLink>}
    </div>}
   </section>
  </div>
 </main>;
}
