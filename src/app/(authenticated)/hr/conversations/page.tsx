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
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
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
 if(!hasActiveRecruiter(context))redirect("/dashboard");
 const raw=await searchParams;
 const parsed=hrConversationQuerySchema.safeParse({collegeId:first(raw.collegeId),q:first(raw.q),page:first(raw.page),unreadOnly:first(raw.unreadOnly),sort:first(raw.sort),scope:first(raw.scope)});
 if(!parsed.success)return <main role="alert" className="space-y-3 p-5">
  <PageHeader eyebrow="Recruiter" title="Conversations"/>
  <p>Invalid conversation filters.</p><Link href="/hr/conversations" className="text-primary-text">Reset</Link></main>;
 const result=await listHrConversations(context,parsed.data);
 const generalResult=result.status==="READY"?await listHrConversations(context,{
  collegeId:result.collegeId,q:"",page:1,unreadOnly:"false",sort:"LATEST",scope:"GENERAL",
 }):null;
 const generalThread=generalResult?.status==="READY" ? generalResult.items.find(row=>!row.jobId)??null:null;
 const generalHistory=generalThread?await readRecruiterThreadMessages(context,generalThread.id,1):null;
 const displayNow=new Date();
 const decisionNotices=result.status==="READY"
  ? await listOwnRecruiterDecisionNotices(context,result.collegeId):[];
 return <main className="space-y-5">
  <RecruiterConversationLiveRefresh/>
  <PageHeader eyebrow="Recruiter · Messages" title="Messages"
   description={result.status==="READY"
    ? result.unreadInView+" unread across "+result.items.filter(row=>row.unread>0).length+" conversation(s) on this page"
    : "Conversations with the placement cell, one per drive, plus a general one."}/>
  <Link href="/hr/messages" className="inline-flex min-h-11 items-center text-primary-text">Notification inbox</Link>
  {result.status!=="READY"?<section className="space-y-3 rounded-xl border border-border p-4">
   <p className="text-sm text-body">{result.status==="NO_ACCESS"?"Your access to this college has ended or was removed. Ask the placement cell to give it again.":"Choose a college to view conversations."}</p>
   {result.choices.map(g=><Link key={g.id} href={"/hr/conversations?collegeId="+g.collegeId}
    className="block rounded-md border border-border p-3 text-primary-text">{g.collegeName}</Link>)}
  </section>:<>
   {decisionNotices.length>0?<section aria-label="Drive request decisions"
     className="rounded-xl border border-border bg-surface p-4">
    <h2 className="font-semibold text-foreground">Drive request decisions</h2>
    <p className="mt-1 text-xs text-muted-foreground">Approval, changes requested and declined decisions for your own requests.</p>
    <ul className="mt-3 space-y-3">{decisionNotices.map(item=><li key={item.id}
      className="rounded-lg border border-border p-3">
      <p className="font-semibold text-foreground">{item.title}{item.unread?" · New":""}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-body">{item.body}</p>
      <p className="mt-1 text-xs text-muted-foreground">{when(item.createdAt)} IST</p>
      <Link href={item.href} className="mt-2 inline-flex min-h-10 items-center text-primary-text underline">
       View your drive request
      </Link>
      {item.unread?<RecruiterDecisionReadButton id={item.id}/>:null}
    </li>)}</ul>
   </section>:null}
   {result.choices.length>1?<nav aria-label="College conversations" className="flex flex-wrap gap-2">
    {result.choices.map(g=><Link key={g.id} href={"/hr/conversations?collegeId="+g.collegeId}
     className="rounded-md border border-border px-4 py-3 text-primary-text">{g.collegeName}</Link>)}
   </nav>:null}
   <section className="rounded-xl border border-border bg-surface p-4">
    <h2 className="font-semibold text-foreground">Talk to the placement cell</h2>
    <p className="mt-1 text-sm text-body">Open your private conversation with this college, without linking a particular hiring drive.</p>
    {generalThread?<details className="mt-3 rounded-lg border border-border p-3">
      <summary className="cursor-pointer text-sm font-semibold text-primary-text">Message the placement cell · General</summary>
      <p className="mt-2 text-sm text-body">Placement cell · General</p>
      {generalThread.preview&&!generalHistory?<p className="mt-2 whitespace-pre-wrap text-sm text-body">
        {generalThread.preview!.text}
      </p>:null}
      {generalHistory?<ol aria-label="General placement-cell messages" className="mt-3 max-h-72 space-y-2 overflow-y-auto">
        {[...generalHistory.messages].reverse().map(message=><li key={message.id}
          className="rounded-lg border border-border bg-surface-subtle p-3 text-sm">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">
            {message.senderType==="RECRUITER"?"You":message.senderDisplayName?"Placement cell · "+message.senderDisplayName:"Placement cell"} · {when(message.createdAt)} IST
          </p>
          <p className="whitespace-pre-wrap break-words text-body">{message.body}</p>
        </li>)}
      </ol>:null}
      <div className="mt-3"><RecruiterConversationReplyForm threadId={generalThread.id}/></div>
      <Link href={"/hr/conversations/"+generalThread.id}
        className="mt-3 inline-flex min-h-10 items-center text-primary-text underline">Open full conversation</Link>
    </details>:null}
    {!generalThread?<form method="post" action="/api/placements/recruiter/conversations/open" className="mt-3">
      <input name="collegeId" type="hidden" value={result.collegeId}/>
      <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
        Open general conversation
      </button>
    </form>:null}
   </section>
   <p className="text-sm text-body">{result.total} conversation(s) · {result.items.filter(row=>row.unread>0).length} with new messages on this page</p>
   <form method="get" action="/hr/conversations" className="flex flex-wrap gap-2">
    <input type="hidden" name="collegeId" value={result.collegeId}/>
    <input type="hidden" name="unreadOnly" value={parsed.data.unreadOnly}/>
    <input type="hidden" name="scope" value={parsed.data.scope}/>
    <label className="text-sm text-body">Order
     <select name="sort" defaultValue={parsed.data.sort} className="mt-1 min-h-11 rounded-md border border-border bg-surface px-3">
      <option value="LATEST">Most recently updated</option><option value="OLDEST">Oldest updated first</option>
     </select>
    </label>
    <label className="flex-1 text-sm text-body">Search by drive or message
     <input name="q" maxLength={120} defaultValue={parsed.data.q}
      className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3"/></label>
    <button type="submit" className="self-end rounded-md border border-border px-4 py-3 text-primary-text">Search</button>
   </form>
   <nav aria-label="Conversation kind" className="flex flex-wrap gap-2">
    {HR_CONVERSATION_KINDS.map(item=><Link key={item.value}
     href={hrConversationsHref({collegeId:result.collegeId,q:parsed.data.q,
      unreadOnly:parsed.data.unreadOnly,sort:parsed.data.sort,scope:item.value,page:1})}
     aria-current={parsed.data.scope===item.value?"page":undefined}
     className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-primary-text">
      {item.label}
    </Link>)}
   </nav>
   <nav aria-label="Conversation status" className="flex flex-wrap gap-2">
    <Link href={hrConversationsHref({collegeId:result.collegeId,q:parsed.data.q,unreadOnly:"false",sort:parsed.data.sort,scope:parsed.data.scope,page:1})}
     aria-current={parsed.data.unreadOnly==="false"?"page":undefined}
     className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-primary-text">All</Link>
    <Link href={hrConversationsHref({collegeId:result.collegeId,q:parsed.data.q,unreadOnly:"true",sort:parsed.data.sort,scope:parsed.data.scope,page:1})}
     aria-current={parsed.data.unreadOnly==="true"?"page":undefined}
     className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-primary-text">Unread</Link>
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
     <button type="submit" className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
      Mark visible unread conversations as read
     </button>
     <span className="text-xs text-muted-foreground">Only incoming placement-cell messages on this page.</span>
    </form>:null}
   <p className="text-sm text-body">Showing {result.first}–{result.last} of {result.total} conversations</p>
   {result.items.length?<ol className="space-y-3">
    {result.items.map(row=><li key={row.id} className="rounded-xl border border-border bg-surface p-4">
     <Link href={"/hr/conversations/"+row.id}
      className="block break-words font-semibold text-primary-text">{row.jobId ? (context.recruiter?.companyName??"Company")+" · "+row.jobTitle : "General"}</Link>
     {row.unread>0?<span aria-label={row.unread+" unread messages"}
      className="mt-2 inline-flex rounded-full border border-border px-2 py-1 text-xs font-semibold text-primary-text">
      {row.unread} new
     </span>:null}
     {row.preview?<p className="mt-2 break-words text-sm text-body">
      {row.preview.senderType==="RECRUITER"?"You: ":"Placement cell: "}{row.preview.text}
     </p>:null}
     <p className="mt-2 text-xs text-muted-foreground">{row.lastMessageAt?timeAgo(row.lastMessageAt,displayNow):"No messages yet"} · Private employer thread</p>
    </li>)}
   </ol>:<p role="status" className="rounded-xl border border-border p-5 text-body">No matching conversations with the placement cell for this college.</p>}
   <nav aria-label="Conversation pages" className="flex flex-wrap gap-3">
    {result.page>1?<Link href={hrConversationsHref({collegeId:result.collegeId,q:parsed.data.q,unreadOnly:parsed.data.unreadOnly,sort:parsed.data.sort,scope:parsed.data.scope,page:result.page-1})}
      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-primary-text">Previous</Link>:null}
    {result.page<result.pages?<Link href={hrConversationsHref({collegeId:result.collegeId,q:parsed.data.q,unreadOnly:parsed.data.unreadOnly,sort:parsed.data.sort,scope:parsed.data.scope,page:result.page+1})}
      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-primary-text">Next</Link>:null}
   </nav>
  </>}
 </main>;
}
