import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {hrConversationQuerySchema} from "@/modules/placements/hr-conversation-inbox-model";
import {listHrConversations} from "@/modules/placements/hr-conversation-inbox-service";
import {hrConversationsHref} from "@/modules/placements/hr-conversation-urls-model";
const HR_CONVERSATION_KINDS=[{value:"ALL",label:"All threads"},{value:"GENERAL",label:"General"},{value:"DRIVE",label:"Hiring drives"}] as const;
type Query={collegeId?:string|string[];q?:string|string[];page?:string|string[];unreadOnly?:string|string[];sort?:string|string[];scope?:string|string[]};
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function when(value:Date){return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(value);}
export default async function RecruiterConversationsPage({searchParams}:{searchParams:Promise<Query>}){
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context))redirect("/dashboard");
 const raw=await searchParams;
 const parsed=hrConversationQuerySchema.safeParse({collegeId:first(raw.collegeId),q:first(raw.q),page:first(raw.page),unreadOnly:first(raw.unreadOnly),sort:first(raw.sort),scope:first(raw.scope)});
 if(!parsed.success)return <main role="alert" className="space-y-3 p-5">
  <PageHeader eyebrow="Recruiter" title="Conversations"/>
  <p>Invalid conversation filters.</p><Link href="/hr/conversations" className="text-primary-text">Reset</Link></main>;
 const result=await listHrConversations(context,parsed.data);
 return <main className="space-y-5">
  <PageHeader eyebrow="Recruiter · Messages" title="Conversations"
   description="Private employer conversations with the placement cell. Notifications remain a separate inbox."/>
  <Link href="/hr/messages" className="inline-flex min-h-11 items-center text-primary-text">Notification inbox</Link>
  {result.status!=="READY"?<section className="space-y-3 rounded-xl border border-border p-4">
   <p className="text-sm text-body">{result.status==="NO_ACCESS"?"No active employer college access.":"Choose a college to view conversations."}</p>
   {result.choices.map(g=><Link key={g.id} href={"/hr/conversations?collegeId="+g.collegeId}
    className="block rounded-md border border-border p-3 text-primary-text">{g.collegeName}</Link>)}
  </section>:<>
   {result.choices.length>1?<nav aria-label="College conversations" className="flex flex-wrap gap-2">
    {result.choices.map(g=><Link key={g.id} href={"/hr/conversations?collegeId="+g.collegeId}
     className="rounded-md border border-border px-4 py-3 text-primary-text">{g.collegeName}</Link>)}
   </nav>:null}
   <section className="rounded-xl border border-border bg-surface p-4">
    <h2 className="font-semibold text-foreground">Talk to the placement cell</h2>
    <p className="mt-1 text-sm text-body">Open your private conversation with this college, without linking a particular hiring drive.</p>
    <form method="post" action="/api/placements/recruiter/conversations/open" className="mt-3">
      <input name="collegeId" type="hidden" value={result.collegeId}/>
      <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
        Open general conversation
      </button>
    </form>
   </section>
   <form method="get" action="/hr/conversations" className="flex flex-wrap gap-2">
    <input type="hidden" name="collegeId" value={result.collegeId}/>
    <input type="hidden" name="unreadOnly" value={parsed.data.unreadOnly}/>
    <input type="hidden" name="scope" value={parsed.data.scope}/>
    <label className="text-sm text-body">Order
     <select name="sort" defaultValue={parsed.data.sort} className="mt-1 min-h-11 rounded-md border border-border bg-surface px-3">
      <option value="LATEST">Most recently updated</option><option value="OLDEST">Oldest updated first</option>
     </select>
    </label>
    <label className="flex-1 text-sm text-body">Search by conversation or drive ID
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
   <p className="text-sm text-body">Showing {result.first}–{result.last} of {result.total} conversations</p>
   {result.items.length?<ol className="space-y-3">
    {result.items.map(row=><li key={row.id} className="rounded-xl border border-border bg-surface p-4">
     <Link href={"/hr/conversations/"+row.id}
      className="block break-words font-semibold text-primary-text">{row.jobTitle}</Link>
     {row.unread>0?<span aria-label={row.unread+" unread messages"}
      className="mt-2 inline-flex rounded-full border border-border px-2 py-1 text-xs font-semibold text-primary-text">
      {row.unread} unread
     </span>:null}
     {row.preview?<p className="mt-2 break-words text-sm text-body">
      {row.preview.senderType==="RECRUITER"?"You: ":"Placement cell: "}{row.preview.text}
     </p>:null}
     <p className="mt-2 text-xs text-muted-foreground">{row.lastMessageAt?"Last update "+when(row.lastMessageAt):"No messages yet"} · Private employer thread</p>
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
