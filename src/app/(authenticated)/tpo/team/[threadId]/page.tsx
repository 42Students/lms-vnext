import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { readTpoInternalConversation } from "@/modules/placements/tpo-team-conversation-service";
export default async function InternalThread({params}:{params:Promise<{threadId:string}>}){
 const context=await getCurrentRequestContext();
 if(!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {threadId}=await params;
 const result=await readTpoInternalConversation(context,threadId);
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
  <ol aria-label="Private team messages" className="space-y-3">
   {result.messages.map(message=><li key={message.id}
    className="min-w-0 rounded-xl border border-border bg-surface p-4">
    <p className="text-xs text-muted-foreground">{message.authorMembershipId===context.membership?.id?"You":"Team member"} · {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(message.createdAt)} IST</p>
    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{message.body}</p>
   </li>)}
  </ol>
  {!result.messages.length?<p role="status" className="rounded-xl border border-border p-5 text-sm text-body">No messages in this thread yet.</p>:null}
  {result.messages.length===200?<p className="text-xs text-muted-foreground">Showing the first 200 messages. Older/newer pages require pagination.</p>:null}
 </main>;
}
