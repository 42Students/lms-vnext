import inboxStyles from "@/components/hr/recruiter-conversations-legacy.module.css";
import { EmptyState } from "@/components/ui/empty-state";
import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
import { Tabs } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { Banner } from "@/components/ui/banner";
import { ScrollCue } from "@/components/ui/scroll-cue";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {hrConversationQuerySchema} from "@/modules/placements/hr-conversation-inbox-model";
import {listHrConversations} from "@/modules/placements/hr-conversation-inbox-service";
import {readRecruiterThreadMessages} from "@/modules/placements/tpo-messaging-service";
import {hrConversationsHref} from "@/modules/placements/hr-conversation-urls-model";
import {listOwnRecruiterDecisionNotices} from "@/modules/placements/recruiter-decision-notice-service";
import {RecruiterDecisionReadButton} from "@/components/hr/recruiter-decision-read-button";
import {RecruiterConversationLiveRefresh} from "@/components/hr/recruiter-conversation-live-refresh";
import {RecruiterConversationReplyForm} from "@/components/hr/recruiter-conversation-reply-form";
import {RecruiterGeneralDrawer} from "@/components/hr/recruiter-general-drawer";
const HR_CONVERSATION_KINDS=[{value:"ALL",label:"All threads"},{value:"GENERAL",label:"General"},{value:"DRIVE",label:"Hiring drives"}] as const;
type Query={collegeId?:string|string[];q?:string|string[];page?:string|string[];unreadOnly?:string|string[];sort?:string|string[];scope?:string|string[]};

function when(value:Date){return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(value);}
function timeAgo(value:Date,now:Date){
 const seconds=Math.round((value.getTime()-now.getTime())/1000);
 const abs=Math.abs(seconds);
 if(abs<30)return "just now";
 const future=seconds>0;
 let count:number,unit:string;
 if(abs<90){count=1;unit="minute";}
 else if(abs<45*60){count=Math.round(abs/60);unit="minute";}
 else if(abs<90*60){count=1;unit="hour";}
 else if(abs<22*3600){count=Math.round(abs/3600);unit="hour";}
 else if(abs<36*3600){count=1;unit="day";}
 else if(abs<26*86400){count=Math.round(abs/86400);unit="day";}
 else if(abs<45*86400){count=1;unit="month";}
 else if(abs<320*86400){count=Math.round(abs/2629800);unit="month";}
 else if(abs<548*86400){count=1;unit="year";}
 else {count=Math.round(abs/31557600);unit="year";}
 const part=count===1?(unit==="hour"?"an hour":unit==="minute"?"a minute":"a "+unit):count+" "+unit+"s";
 return future?"in "+part:part+" ago";
}
export default async function RecruiterConversationsPage({searchParams}:{searchParams:Promise<Query>}){
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context) || context.recruiter?.userId !== context.user.id)redirect("/dashboard");
 const raw=await searchParams;
 const parsed=hrConversationQuerySchema.safeParse({collegeId:raw.collegeId,q:raw.q,page:raw.page,unreadOnly:raw.unreadOnly,sort:raw.sort,scope:raw.scope});
 if(!parsed.success)return <div className="min-w-0 space-y-3">
  <PageHeader title="Messages"/>
  <ErrorState title="Invalid conversation filters" description="Review the college and conversation filters."
    action={<Link href="/hr/conversations" className="inline-flex min-h-11 md:min-h-9 items-center text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Reset</Link>}/></div>;
 const result=await listHrConversations(context,parsed.data).catch((error:unknown)=>{
   if(error instanceof AuthorizationError)throw error;
   return null;
 });
 if(!result)return <div className="min-w-0 space-y-3">
   <PageHeader title="Messages"/>
   <ErrorState title="Could not load your messages"
     description="Your inbox could not be refreshed. Please try again."
     retryHref="/hr/conversations" retryLabel="Retry"/>
 </div>;
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
 return <div className="min-w-0 max-w-full space-y-4 min-[768px]:space-y-6">
  <RecruiterConversationLiveRefresh/>
  <PageHeader title="Messages"
   description={result.status==="READY"
    ? result.total.toLocaleString("en-IN")+" conversation"+(result.total===1?"":"s")+
      " · "+result.unreadTotal+" unread message"+(result.unreadTotal===1?"":"s")
    : "Conversations with the placement cell, one per drive, plus a general one."}
   actions={<div className="flex flex-wrap items-center gap-3">
     {result.status==="READY"?<RecruiterGeneralDrawer>
       <section className="border-b border-border pb-4">
    <h2 className="text-[16px] font-semibold leading-[26px] text-[var(--lms-heading)] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">Talk to the placement cell</h2>
    <p className="mt-1 max-w-2xl text-sm text-body">Open your private conversation with this college, without linking a particular hiring drive.</p>
    {generalThread?<div className="mt-3 space-y-3 border-t border-border py-3">
      <p className="mt-2 text-sm text-body">Placement cell · General</p>
      {generalThread.preview&&!generalHistory&&!generalHistoryResult?<p className="mt-2 whitespace-pre-wrap text-sm text-body">
        {generalThread.preview!.text}
      </p>:null}
      {generalHistoryResult && !generalHistoryResult.ok?
        <p role="status" className="mt-2 text-sm text-body leading-[1.6]">
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
        className="mt-3 inline-flex min-h-11 md:min-h-9 items-center text-primary-text underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Open full conversation</Link>
    </div>:null}
    {generalLookup && !generalLookup.ok?
      <p role="status" className="mt-3 text-sm text-body leading-[1.6]">
        General conversation preview is temporarily unavailable. Refresh to try again; existing conversations remain accessible.
      </p>:null}
    {!generalThread && (!generalLookup || generalLookup.ok)?<p className="mt-2 text-sm text-muted-foreground">Questions that are not about one drive go here.</p>:null}
    {!generalThread && (!generalLookup || generalLookup.ok)?<form method="post" action="/api/placements/recruiter/conversations/open" className="mt-3">
      <Input name="collegeId" type="hidden" value={result.collegeId}/>
      <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Open general conversation</Button>
    </form>:null}
   </section>
     </RecruiterGeneralDrawer>:null}
     <Link href="/hr/notifications"
       className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-primary-text underline md:min-h-9">Notification inbox</Link>
    </div>}/>
  {result.status!=="READY"?<section className="space-y-3 border-b border-border pb-4">
   <p className="text-sm text-body">{result.status==="NO_ACCESS"?"Your access to this college has ended or was removed. Ask the placement cell to give it again.":"Choose a college to view conversations."}</p>
   <NeedsDoingChips label="Authorized colleges:" items={result.choices.map(g=>({
     key:g.collegeId,label:g.collegeName,
     href:"/hr/conversations?collegeId="+encodeURIComponent(g.collegeId),
    }))}/>
  </section>:<>
   {decisionNoticeResult && !decisionNoticeResult.ok?
     <Banner tone="warning">
       Drive request decisions are temporarily unavailable. Conversations are still accessible; refresh to try again.
     </Banner>:null}
   {decisionNotices.length>0?<details className="min-w-0 border-b border-border pb-4">
    <summary className="flex min-h-11 cursor-pointer items-center text-[16px] font-semibold leading-[26px] text-[var(--lms-heading)] min-[768px]:text-[18px] min-[768px]:leading-7">Drive request decisions</summary>
    <p className="mt-1 text-xs text-muted-foreground">Approval, changes requested and declined decisions for your own requests.</p>
    <ul className="mt-3 space-y-3">{decisionNotices.map(item=><li key={item.id}
      className="border-b border-border py-3 last:border-b-0">
      <p className="font-semibold text-foreground">{item.title}{item.unread?" · New":""}</p>
      <p className="mt-1 max-w-prose whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm text-body">{item.body}</p>
      <p className="mt-1 text-xs text-muted-foreground">{when(item.createdAt)} IST</p>
      <Link href={item.href} className="mt-2 inline-flex min-h-11 md:min-h-9 items-center text-primary-text underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
       View your drive request
      </Link>
      {item.unread?<RecruiterDecisionReadButton id={item.id}/>:null}
    </li>)}</ul>
   </details>:null}
   {result.choices.length>1?<NeedsDoingChips label="College conversations:"
      selectedKey={result.collegeId}
      items={result.choices.map(grant=>({
        key:grant.collegeId,label:grant.collegeName,
        href:"/hr/conversations?collegeId="+encodeURIComponent(grant.collegeId),
      }))}/>:null}
   <section aria-label="Conversations with the placement cell" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 sm:p-6">
   {result.total>6 || parsed.data.q ? <form method="get" action="/hr/conversations" role="search" aria-label="Conversation search and sort" className="flex min-w-0 flex-wrap items-end gap-[8px] max-[767px]:flex-col max-[767px]:items-stretch">
    <Input type="hidden" name="collegeId" value={result.collegeId}/>
    <Input type="hidden" name="unreadOnly" value={parsed.data.unreadOnly}/>
    <Input type="hidden" name="scope" value={parsed.data.scope}/>
    <label className="grid min-w-0 gap-1 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] max-[767px]:w-full">Order
     <Select name="sort" defaultValue={parsed.data.sort} className="mt-1">
      <option value="LATEST">Most recently updated</option><option value="OLDEST">Oldest updated first</option>
     </Select>
    </label>
    <label className={"min-w-0 w-full flex-1 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] md:min-w-[220px] "+inboxStyles.searchField}>Search by drive or message
     <Input name="q" type="search" maxLength={120} placeholder="⌕ Search by drive or message" defaultValue={parsed.data.q} className="mt-1 min-h-11 w-full md:min-h-9"/></label>
    <Button type="submit" variant="secondary" className="min-h-11 w-full self-end md:min-h-9 md:w-auto">Search</Button>
   </form> :
    <details className="min-w-0 border-b border-border pb-3">
      <summary className="min-h-11 cursor-pointer text-sm font-semibold leading-10 text-primary-text">Search and sort conversations</summary>
      <form method="get" action="/hr/conversations" role="search" aria-label="Conversation search and sort" className="flex min-w-0 flex-wrap items-end gap-[8px] max-[767px]:flex-col max-[767px]:items-stretch">
    <Input type="hidden" name="collegeId" value={result.collegeId}/>
    <Input type="hidden" name="unreadOnly" value={parsed.data.unreadOnly}/>
    <Input type="hidden" name="scope" value={parsed.data.scope}/>
    <label className="grid min-w-0 gap-1 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] max-[767px]:w-full">Order
     <Select name="sort" defaultValue={parsed.data.sort} className="mt-1">
      <option value="LATEST">Most recently updated</option><option value="OLDEST">Oldest updated first</option>
     </Select>
    </label>
    <label className={"min-w-0 w-full flex-1 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] md:min-w-[220px] "+inboxStyles.searchField}>Search by drive or message
     <Input name="q" type="search" maxLength={120} placeholder="⌕ Search by drive or message" defaultValue={parsed.data.q} className="mt-1 min-h-11 w-full md:min-h-9"/></label>
    <Button type="submit" variant="secondary" className="min-h-11 w-full self-end md:min-h-9 md:w-auto">Search</Button>
   </form>
    </details>}
   <Tabs renderPanel={false} ariaLabel="Conversation kind" value={parsed.data.scope}
    items={HR_CONVERSATION_KINDS.map(item => ({value:item.value,label:item.label,
      href:hrConversationsHref({collegeId:result.collegeId,q:parsed.data.q,
        unreadOnly:parsed.data.unreadOnly,sort:parsed.data.sort,scope:item.value,page:1})}))}/>
   <Tabs renderPanel={false} ariaLabel="Conversation status" value={parsed.data.unreadOnly}
    items={[{value:"false",label:"All",href:hrConversationsHref({collegeId:result.collegeId,
      q:parsed.data.q,unreadOnly:"false",sort:parsed.data.sort,scope:parsed.data.scope,page:1})},
      {value:"true",label:"Unread",href:hrConversationsHref({collegeId:result.collegeId,
      q:parsed.data.q,unreadOnly:"true",sort:parsed.data.sort,scope:parsed.data.scope,page:1})}]}/>
   <p role="status" className="text-sm text-body leading-[1.6]">
    {result.unreadInView} unread placement cell messages in these conversations
   </p>
   {result.unreadInView>0?<form method="post"
     action="/api/placements/recruiter/conversations/acknowledge"
     className="flex flex-wrap items-center gap-3">
     {result.items.filter(row=>row.unread>0).map(row=>
      <Input key={row.id} type="hidden" name="threadId" value={row.id}/>)}
     <Input type="hidden" name="returnTo" value={hrConversationsHref({
      collegeId:result.collegeId,q:parsed.data.q,unreadOnly:parsed.data.unreadOnly,
      sort:parsed.data.sort,scope:parsed.data.scope,page:result.page,
     })}/>
     <Button type="submit" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto">Mark visible unread conversations as read</Button>
     <span className="text-xs text-muted-foreground">Only incoming placement-cell messages on this page.</span>
    </form>:null}
   <p className="text-sm text-body">Showing {result.first.toLocaleString("en-IN")}–{result.last.toLocaleString("en-IN")} of {result.total.toLocaleString("en-IN")} conversations · {result.items.filter(row=>row.unread>0).length} with new messages on this page</p>
   {result.items.length?<ol className="min-w-0 divide-y divide-border border-y border-border">
    {visibleRows.map(row=><li key={row.id} className="min-w-0 py-3 transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-table-hover)] motion-reduce:transition-none">
     <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-1"><Link href={"/hr/conversations/"+row.id}
      className="inline-flex min-h-11 min-w-0 flex-1 items-center gap-2 break-words [overflow-wrap:anywhere] font-semibold text-primary-text md:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"><span aria-hidden="true" className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e5f3f3] text-[18px] text-[#166b74]">✉{row.unread>0?<span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-[#d6a12d]"/>:null}</span>{row.jobId ? (context.recruiter?.companyName??"Company")+" · "+row.jobTitle : "General"}</Link>
     {row.unread>0?<Badge tone="warning" aria-label={row.unread+" unread messages"} className="shrink-0 self-center">{row.unread} new</Badge>:null}</div>
     {row.preview?<p className="mt-1 max-w-3xl truncate text-sm leading-6 text-body">
      {row.preview.text}
     </p>:null}
     <p className="mt-1 break-words text-xs text-muted-foreground">{row.lastMessageAt?timeAgo(row.lastMessageAt,displayNow):"No messages yet"} · Private employer thread</p>
    </li>)}
   </ol>:<EmptyState title={parsed.data.q?"No conversations match your search":"No messages yet"} description={parsed.data.q?"Try another drive or message search.":"Write to the placement cell, or open a drive to discuss its hiring process."} action={<Link href={hrConversationsHref({collegeId:result.collegeId,q:"",unreadOnly:"false",sort:"LATEST",scope:"ALL",page:1})} className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9">Reset</Link>}/>}
   {result.pages>1 ? <nav aria-label="Conversation pages" className="flex min-w-0 flex-wrap gap-3 max-[767px]:[&>a]:w-full max-[767px]:[&>a]:justify-center">
    {result.page>1?<Link href={hrConversationsHref({collegeId:result.collegeId,q:parsed.data.q,unreadOnly:parsed.data.unreadOnly,sort:parsed.data.sort,scope:parsed.data.scope,page:result.page-1})}
      className="inline-flex min-h-11 md:min-h-9 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-border px-4 text-primary-text hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] text-sm">Previous</Link>:null}
    {result.page<result.pages?<Link href={hrConversationsHref({collegeId:result.collegeId,q:parsed.data.q,unreadOnly:parsed.data.unreadOnly,sort:parsed.data.sort,scope:parsed.data.scope,page:result.page+1})}
      className="inline-flex min-h-11 md:min-h-9 items-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-border px-4 text-primary-text hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] text-sm">Next</Link>:null}
   </nav> : null}
   </section>
  </>}
 </div>;
}
