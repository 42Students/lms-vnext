import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { readTpoInternalConversation, tpoThreadIdSchema, tpoMessagePageSchema } from "@/modules/placements/tpo-team-conversation-service";
export default async function InternalThread({params,searchParams}:{params:Promise<{threadId:string}>;searchParams:Promise<{page?:string|string[]}>}){
 const context=await getCurrentRequestContext();
 if(!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {threadId}=await params;
 const parsed=tpoThreadIdSchema.safeParse(threadId);
 if(!parsed.success)notFound();
 const query=await searchParams;
 const rawPage=Array.isArray(query.page)?query.page[0]:query.page;
 const parsedPage=tpoMessagePageSchema.safeParse(rawPage ?? 1);
 if(!parsedPage.success)notFound();
 const result=await readTpoInternalConversation(context,parsed.data,parsedPage.data);
 if(result.status==="NOT_FOUND")notFound();
 if(result.status==="NOT_REGISTERED")return <main className="space-y-4 p-5">
   <PageHeader eyebrow="TPO · Team" title="Conversations unavailable"/>
   <p role="status">Private messaging tables are not registered.</p>
   <Link href="/tpo/team" className="text-primary-text">Back to team</Link>
 </main>;
 return <main className="space-y-5">
  <PageHeader eyebrow="TPO · Team" title={result.thread.topic}
   description="Private conversation between the named college team participants."/>
  <Link href="/tpo/team?tab=conversations" className="inline-flex min-h-11 items-center text-primary-text">Back to team conversations</Link>
  <form method="post" action={"/api/placements/tpo/team/threads/"+result.thread.id+"/acknowledge"}>
   <button type="submit"
    className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
    Mark this conversation&apos;s alerts as read
   </button>
  </form>
  <ol aria-label="Private team messages" className="space-y-3">
   {result.messages.map(message=><li key={message.id}
    className="min-w-0 rounded-xl border border-border bg-surface p-4">
    <p className="text-xs text-muted-foreground">{message.authorMembershipId===context.membership?.id?"You":"Team member"} · {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(message.createdAt)} IST</p>
    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{message.body}</p>
   </li>)}
  </ol>
  <nav aria-label="Team message history pages" className="flex flex-wrap items-center gap-3 text-sm">
   <span className="text-body">Page {result.page} of {result.pages}</span>
   {result.page < result.pages ? <Link
    href={"/tpo/team/"+result.thread.id+"?page="+(result.page+1)}
    className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-primary-text">
    Older messages
   </Link> : null}
   {result.page > 1 ? <Link
    href={"/tpo/team/"+result.thread.id+"?page="+(result.page-1)}
    className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-primary-text">
    Newer messages
   </Link> : null}
  </nav>
  <form method="post" action={"/api/placements/tpo/team/threads/"+result.thread.id+"/messages"}
   className="space-y-3 rounded-xl border border-border bg-surface p-4">
   <h2 className="font-semibold text-foreground">Reply privately</h2>
   <label className="grid gap-1 text-sm text-body">Message
    <textarea name="body" required maxLength={4000} rows={4}
     className="rounded-md border border-border bg-surface p-3"
     placeholder="Share a private team update" />
   </label>
   <p className="text-xs text-muted-foreground">Only active TPO participants can reply. Message text is not included in audit records.</p>
   <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Send to team member</button>
  </form>
  {!result.messages.length?<p role="status" className="rounded-xl border border-border p-5 text-sm text-body">No messages in this thread yet.</p>:null}

 </main>;
}
