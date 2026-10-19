import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollCue } from "@/components/ui/scroll-cue";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {hrConversationQuerySchema} from "@/modules/placements/hr-conversation-inbox-model";
import {listHrConversations} from "@/modules/placements/hr-conversation-inbox-service";
import {readRecruiterThreadMessages} from "@/modules/placements/tpo-messaging-service";
import {hrConversationsHref} from "@/modules/placements/hr-conversation-urls-model";
import {listOwnRecruiterDecisionNotices} from "@/modules/placements/recruiter-decision-notice-service";
import {RecruiterDecisionReadButton} from "@/components/hr/recruiter-decision-read-button";
import {RecruiterConversationLiveRefresh} from "@/components/hr/recruiter-conversation-live-refresh";
import {RecruiterConversationReplyForm} from "@/components/hr/recruiter-conversation-reply-form";
const HR_CONVERSATION_KINDS=[{value:"ALL",label:"All threads"},{value:"GENERAL",label:"General"},{value:"DRIVE",label:"Hiring drives"}] as const;
type Query={collegeId?:string|string[];q?:string|string[];page?:string|string[];unreadOnly?:string|string[];sort?:string|string[];scope?:string|string[]};

function when(value:Date){return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(value);}
function timeAgo(value:Date,now:Date){
 const minutes=Math.max(0,Math.floor((now.getTime()-value.getTime())/60000));
 if(minutes<1)return "just now";
 if(minutes<60)return minutes+" minute"+(minutes===1?"":"s")+" ago";
 const hours=Math.floor(minutes/60);
 if(hours<24)return hours+" hour"+(hours===1?"":"s")+" ago";
 const days=Math.floor(hours/24);
 return days+" day"+(days===1?"":"s")+" ago";
}
export default async function RecruiterConversationsPage({searchParams}:{searchParams:Promise<Query>}){
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context) || context.recruiter?.userId !== context.user.id)redirect("/dashboard");
 const raw=await searchParams;
 const parsed=hrConversationQuerySchema.safeParse({collegeId:raw.collegeId,q:raw.q,page:raw.page,unreadOnly:raw.unreadOnly,sort:raw.sort,scope:raw.scope});
 if(!parsed.success)return <div role="alert" className="space-y-3">
  <PageHeader eyebrow="Recruiter" title="Conversations"/>
  <p>Invalid conversation filters.</p><Link href="/hr/conversations" className="text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Reset</Link></div>;
 const result=await listHrConversations(context,parsed.data);
 const generalLookup=result.status==="READY"
  ?await listHrConversations(context,{
    collegeId:result.collegeId,q:"",page:1,unreadOnly:"false",sort:"LATEST",scope:"GENERAL",
   }).then(value=>({ok:true as const,value})).catch(()=>({ok:false as const}))
  :null;
 const generalResult=generalLookup?.ok?generalLookup.value:null;
 const generalThread=generalResult?.status==="READY" ? generalResult.items.find(row=>!row.jobId)??null:null;
 // The general-thread preview and decision bell are optional enrichments.
 // A stale grant or downstream failure must never resurrect cached message text
 // or make the rest of an authorized conversation directory disappear.
 const generalHistoryResult=generalThread
  ?await readRecruiterThreadMessages(context,generalThread.id,1)
    .then(value=>({ok:true as const,value}))
    .catch(()=>({ok:false as const}))
  :null;
 const generalHistory=generalHistoryResult?.ok?generalHistoryResult.value:null;
 const displayNow=new Date();
 const decisionNoticeResult=result.status==="READY"
  ?await listOwnRecruiterDecisionNotices(context,result.collegeId)
    .then(value=>({ok:true as const,value}))
    .catch(()=>({ok:false as const}))
  :null;
 const decisionNotices=decisionNoticeResult?.ok?decisionNoticeResult.value:[];
 const visibleRows=generalHistoryResult && !generalHistoryResult.ok && generalThread
  ?result.items.map(row=>row.id===generalThread.id?{...row,preview:null}:row)
  :result.items;
 return <div className="min-w-0 max-w-full space-y-5">
  <RecruiterConversationLiveRefresh/>
  <PageHeader eyebrow="Recruiter · Messages" title="Messages"
   description={result.status==="READY"
    ? result.unreadInView+" unread across "+result.items.filter(row=>row.unread>0).length+" conversation(s) on this page"
    : "Conversations with the placement cell, one per drive, plus a general one."}/>
  <Link href="/hr/notifications" className="inline-flex min-h-9 items-center text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Notification inbox</Link>
  {result.status!=="READY"?<section className="space-y-3 border-b border-border pb-4">
   <p className="text-sm text-body">{result.status==="NO_ACCESS"?"Your access to this college has ended or was removed. Ask the placement cell to give it again.":"Choose a college to view conversations."}</p>
   {result.choices.map(g=><Link key={g.id} href={"/hr/conversations?collegeId="+g.collegeId}
    className="block rounded-[var(--lms-control-radius)] border border-border p-3 text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-h-9">{g.collegeName}</Link>)}
  </section>:<>
   {decisionNoticeResult && !decisionNoticeResult.ok?
     <p role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm text-body">
       Drive request decisions are temporarily unavailable. Conversations are still accessible; refresh to try again.
     </p>:null}
   {decisionNotices.length>0?<section aria-label="Drive request decisions"
     className="border-b border-border pb-4">
    <h2 className="font-semibold text-foreground">Drive request decisions</h2>
    <p className="mt-1 text-xs text-muted-foreground">Approval, changes requested and declined decisions for your own requests.</p>
    <ul className="mt-3 space-y-3">{decisionNotices.map(item=><li key={item.id}
      className="border-b border-border py-3 last:border-b-0">
      <p className="font-semibold text-foreground">{item.title}{item.unread?" · New":""}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-body">{item.body}</p>
      <p className="mt-1 text-xs text-muted-foreground">{when(item.createdAt)} IST</p>
      <Link href={item.href} className="mt-2 inline-flex min-h-9 items-center text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
       View your drive request
      </Link>
      {item.unread?<RecruiterDecisionReadButton id={item.id}/>:null}
    </li>)}</ul>
   </section>:null}
   {result.choices.length>1?<nav aria-label="College conversations" className="flex flex-wrap gap-3">
    {result.choices.map(g=><Link key={g.id} href={"/hr/conversations?collegeId="+g.collegeId}
      aria-current={g.collegeId===result.collegeId?"page":undefined}
     className={g.collegeId===result.collegeId ? "inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-3 py-2 text-sm font-semibold text-on-primary" : "inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-sm text-primary-text hover:border-primary hover:bg-primary-subtle"}>{g.collegeName}</Link>)}
   </nav>:null}
   <section className="border-b border-border pb-4">
    <h2 className="font-semibold text-foreground">Talk to the placement cell</h2>
    <p className="mt-1 text-sm text-body">Open your private conversation with this college, without linking a particular hiring drive.</p>
    {generalThread?<details className="mt-3 border-b border-border py-3">
      <summary className="min-h-11 cursor-pointer rounded-[var(--lms-control-radius)] py-2 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Message the placement cell · General</summary>
      <p className="mt-2 text-sm text-body">Placement cell · General</p>
      {generalThread.preview&&!generalHistory&&!generalHistoryResult?<p className="mt-2 whitespace-pre-wrap text-sm text-body">
        {generalThread.preview!.text}
      </p>:null}
      {generalHistoryResult && !generalHistoryResult.ok?
        <p role="status" className="mt-2 text-sm text-body">
          General message history is unavailable right now. Refresh or contact the placement cell if access was removed.
        </p>:null}
      {generalHistory?<ScrollCue axis="y" label="General placement-cell messages" className="mt-3" viewportClassName="max-h-72"><ol aria-label="General placement-cell messages" className="space-y-2">
        {[...generalHistory.messages].reverse().map(message=><li key={message.id}
          className="border-b border-border py-3 text-sm last:border-b-0">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">
            {message.senderType==="RECRUITER"?"You":message.senderDisplayName?"Placement cell · "+message.senderDisplayName:"Placement cell"} · {when(message.createdAt)} IST
          </p>
          <p className="whitespace-pre-wrap break-words text-body">{message.body}</p>
        </li>)}
      </ol></ScrollCue>:null}
      {generalHistoryResult?.ok?<div className="mt-3"><RecruiterConversationReplyForm threadId={generalThread.id}/></div>:null}
      <Link href={"/hr/conversations/"+generalThread.id}
        className="mt-3 inline-flex min-h-9 items-center text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Open full conversation</Link>
    </details>:null}
    {generalLookup && !generalLookup.ok?
      <p role="status" className="mt-3 text-sm text-body">
        General conversation preview is temporarily unavailable. Refresh to try again; existing conversations remain accessible.
      </p>:null}
    {!generalThread && (!generalLookup || generalLookup.ok)?<form method="post" action="/api/placements/recruiter/conversations/open" className="mt-3">
      <input name="collegeId" type="hidden" value={result.collegeId}/>
      <Button type="submit">Open general conversation</Button>
    </form>:null}
   </section>
   <p className="text-sm text-body">{result.total} conversation(s) · {result.items.filter(row=>row.unread>0).length} with new messages on this page</p>
   <form method="get" action="/hr/conversations" className="flex flex-wrap gap-2">
    <input type="hidden" name="collegeId" value={result.collegeId}/>
    <input type="hidden" name="unreadOnly" value={parsed.data.unreadOnly}/>
    <input type="hidden" name="scope" value={parsed.data.scope}/>
    <label className="text-sm text-body">Order
     <Select name="sort" defaultValue={parsed.data.sort} className="mt-1">
      <option value="LATEST">Most recently updated</option><option value="OLDEST">Oldest updated first</option>
     </Select>
    </label>
    <label className="flex-1 text-sm text-body">Search by drive or message
     <Input name="q" maxLength={120} defaultValue={parsed.data.q} className="mt-1"/></label>
    <Button type="submit" variant="secondary" className="self-end">Search</Button>
   </form>
   <nav aria-label="Conversation kind" className="flex flex-wrap gap-3 border-b border-border">
    {HR_CONVERSATION_KINDS.map(item=><Link key={item.value}
     href={hrConversationsHref({collegeId:result.collegeId,q:parsed.data.q,
      unreadOnly:parsed.data.unreadOnly,sort:parsed.data.sort,scope:item.value,page:1})}
     aria-current={parsed.data.scope===item.value?"page":undefined}
     className={parsed.data.scope===item.value ? "inline-flex min-h-9 items-center border-b-[3px] border-[#26bac7] px-3 py-2 text-[13px] font-semibold text-[var(--lms-primary-text)]" : "inline-flex min-h-9 items-center border-b-[3px] border-transparent px-3 py-2 text-[13px] text-body hover:text-primary-text"}>
      {item.label}
    </Link>)}
   </nav>
   <nav aria-label="Conversation status" className="flex flex-wrap gap-3 border-b border-border">
    <Link href={hrConversationsHref({collegeId:result.collegeId,q:parsed.data.q,unreadOnly:"false",sort:parsed.data.sort,scope:parsed.data.scope,page:1})}
     aria-current={parsed.data.unreadOnly==="false"?"page":undefined}
     className={parsed.data.unreadOnly==="false" ? "inline-flex min-h-9 items-center border-b-[3px] border-[#26bac7] px-3 py-2 text-[13px] font-semibold text-[var(--lms-primary-text)]" : "inline-flex min-h-9 items-center border-b-[3px] border-transparent px-3 py-2 text-[13px] text-body hover:text-primary-text"}>All</Link>
    <Link href={hrConversationsHref({collegeId:result.collegeId,q:parsed.data.q,unreadOnly:"true",sort:parsed.data.sort,scope:parsed.data.scope,page:1})}
     aria-current={parsed.data.unreadOnly==="true"?"page":undefined}
     className={parsed.data.unreadOnly==="true" ? "inline-flex min-h-9 items-center border-b-[3px] border-[#26bac7] px-3 py-2 text-[13px] font-semibold text-[var(--lms-primary-text)]" : "inline-flex min-h-9 items-center border-b-[3px] border-transparent px-3 py-2 text-[13px] text-body hover:text-primary-text"}>Unread</Link>
   </nav>
   <p role="status" className="text-sm text-body">
    {result.unreadInView} unread placement cell messages in these conversations
   </p>
   {result.unreadInView>0?<form method="post"
     action="/api/placements/recruiter/conversations/acknowledge"
     className="flex flex-wrap items-center gap-3">
     {result.items.filter(row=>row.unread>0).map(row=>
      <input key={row.id} type="hidden" name="threadId" value={row.id}/>)}
     <input type="hidden" name="returnTo" value={hrConversationsHref({
      collegeId:result.collegeId,q:parsed.data.q,unreadOnly:parsed.data.unreadOnly,
      sort:parsed.data.sort,scope:parsed.data.scope,page:result.page,
     })}/>
     <Button type="submit" variant="secondary">Mark visible unread conversations as read</Button>
     <span className="text-xs text-muted-foreground">Only incoming placement-cell messages on this page.</span>
    </form>:null}
   <p className="text-sm text-body">Showing {result.first}–{result.last} of {result.total} conversations</p>
   {result.items.length?<ol className="divide-y divide-[#e5e9f0] border-y border-[#e5e9f0]">
    {visibleRows.map(row=><li key={row.id} className="rounded-[8px] px-2 py-4 transition-colors hover:bg-[#fafbfc] first:pt-3 last:pb-3">
     <Link href={"/hr/conversations/"+row.id}
      className="block break-words font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-h-9">{row.jobId ? (context.recruiter?.companyName??"Company")+" · "+row.jobTitle : "General"}</Link>
     {row.unread>0?<span aria-label={row.unread+" unread messages"}
      className="mt-2 inline-flex rounded-full border border-border px-2 py-1 text-xs font-semibold text-primary-text">
      {row.unread} new
     </span>:null}
     {row.preview?<p className="mt-2 break-words text-sm text-body">
      {row.preview.senderType==="RECRUITER"?"You: ":"Placement cell: "}{row.preview.text}
     </p>:null}
     <p className="mt-2 text-xs text-muted-foreground">{row.lastMessageAt?timeAgo(row.lastMessageAt,displayNow):"No messages yet"} · Private employer thread</p>
    </li>)}
   </ol>:<p role="status" className="border-y border-border py-5 text-body">No matching conversations with the placement cell for this college.</p>}
   <nav aria-label="Conversation pages" className="flex flex-wrap gap-3">
    {result.page>1?<Link href={hrConversationsHref({collegeId:result.collegeId,q:parsed.data.q,unreadOnly:parsed.data.unreadOnly,sort:parsed.data.sort,scope:parsed.data.scope,page:result.page-1})}
      className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Previous</Link>:null}
    {result.page<result.pages?<Link href={hrConversationsHref({collegeId:result.collegeId,q:parsed.data.q,unreadOnly:parsed.data.unreadOnly,sort:parsed.data.sort,scope:parsed.data.scope,page:result.page+1})}
      className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Next</Link>:null}
   </nav>
  </>}
 </div>;
}
