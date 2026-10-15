import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {hrConversationQuerySchema} from "@/modules/placements/hr-conversation-inbox-model";
import {listHrConversations} from "@/modules/placements/hr-conversation-inbox-service";
type Query={collegeId?:string|string[];q?:string|string[]};
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value;}
function when(value:Date){return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(value);}
export default async function RecruiterConversationsPage({searchParams}:{searchParams:Promise<Query>}){
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context))redirect("/dashboard");
 const raw=await searchParams;
 const parsed=hrConversationQuerySchema.safeParse({collegeId:first(raw.collegeId),q:first(raw.q)});
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
   <form method="get" action="/hr/conversations" className="flex flex-wrap gap-2">
    <input type="hidden" name="collegeId" value={result.collegeId}/>
    <label className="flex-1 text-sm text-body">Search by conversation or drive ID
     <input name="q" maxLength={120} defaultValue={parsed.data.q}
      className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3"/></label>
    <button type="submit" className="self-end rounded-md border border-border px-4 py-3 text-primary-text">Search</button>
   </form>
   {result.truncated?<p role="status" className="text-sm text-body">Showing the latest 100 conversations.</p>:null}
   {result.items.length?<ol className="space-y-3">
    {result.items.map(row=><li key={row.id} className="rounded-xl border border-border bg-surface p-4">
     <Link href={"/hr/conversations/"+row.id}
      className="block break-words font-semibold text-primary-text">{row.jobTitle}</Link>
     <p className="mt-2 text-xs text-muted-foreground">{row.lastMessageAt?"Last update "+when(row.lastMessageAt):"No messages yet"} · Private employer thread</p>
    </li>)}
   </ol>:<p role="status" className="rounded-xl border border-border p-5 text-body">No matching conversations with the placement cell for this college.</p>}
  </>}
 </main>;
}
