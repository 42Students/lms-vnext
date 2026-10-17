import Link from "next/link";
import {TpoLiveRefresh} from "@/components/tpo/tpo-live-refresh";
import {TpoTeamReplyComposer} from "@/components/tpo/tpo-team-forms";
import {TpoTeamFollowControls} from "@/components/tpo/tpo-team-follow-controls";
import {getTpoTeamThreadPreferences} from "@/modules/placements/tpo-team-preferences-service";
import {TpoTeamMessageScroll} from "@/components/tpo/tpo-team-message-scroll";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { readTpoInternalConversation, tpoThreadIdSchema, tpoMessagePageSchema } from "@/modules/placements/tpo-team-conversation-service";
export default async function InternalThread({params,searchParams}:{params:Promise<{threadId:string}>;searchParams:Promise<{page?:string|string[];m?:string|string[]}>}){
 const context=await getCurrentRequestContext();
 if(!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {threadId}=await params;
 const parsed=tpoThreadIdSchema.safeParse(threadId);
 if(!parsed.success)notFound();
 const query=await searchParams;
 const rawPage=Array.isArray(query.page)?query.page[0]:query.page;
 const parsedPage=tpoMessagePageSchema.safeParse(rawPage ?? 1);
 const rawMessage=Array.isArray(query.m)?query.m[0]:query.m;
 const highlightId=rawMessage&&tpoThreadIdSchema.safeParse(rawMessage).success?rawMessage:undefined;
 if(!parsedPage.success)notFound();
 const result=await readTpoInternalConversation(context,parsed.data,parsedPage.data);
 if(result.status==="NOT_FOUND")notFound();
 if(result.status==="NOT_REGISTERED")return <main className="space-y-4 p-5">
   <PageHeader eyebrow="TPO · Team" title="Conversations unavailable"/>
   <p role="status">Private messaging tables are not registered.</p>
   <Link href="/tpo/team" className="text-primary-text">Back to team</Link>
 </main>;
 const preferences=await getTpoTeamThreadPreferences(context,parsed.data);
 return <main className="space-y-5">
  <TpoLiveRefresh intervalMs={30000}/>
  <PageHeader eyebrow="TPO · Team" title={result.thread.topic}
   description={"With "+result.thread.counterpartName+" · Private placement-team conversation."}/>
  <Link href="/tpo/team?tab=conversations" className="inline-flex min-h-11 items-center text-primary-text">All conversations</Link>
  <TpoTeamFollowControls threadId={result.thread.id} following={preferences.following}
   muted={preferences.muted} ready={preferences.status==="READY"}/>
  <form method="post" action={"/api/placements/tpo/team/threads/"+result.thread.id+"/acknowledge"}>
   <button type="submit"
    className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
    Mark this conversation&apos;s alerts as read
   </button>
  </form>
  <ol role="log" aria-live="polite" aria-busy={false} aria-label="Private team messages" className="space-y-3">
   {result.messages.map((message,index)=>{
    const day=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
     timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric",
    }).format(date);
    const own=message.authorMembershipId===context.membership?.id;
    const showDay=index===0||day(result.messages[index-1].createdAt)!==day(message.createdAt);
    return <li id={"team-message-"+message.id} key={message.id} className="min-w-0">
     {showDay?<p className="my-3 text-center text-xs font-semibold text-muted-foreground">{day(message.createdAt)}</p>:null}
     <div className={own?
      "ml-auto max-w-[88%] rounded-xl border border-border bg-surface-secondary p-4":
      "mr-auto max-w-[88%] rounded-xl border border-border bg-surface p-4"}>
      <p className="text-xs text-muted-foreground">
       {own?"You":message.authorName?.trim()||"Team member"} ·
       {" "}{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",timeStyle:"short"}).format(message.createdAt)} IST
      </p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{message.body}</p>
     </div>
    </li>;
   })}
  </ol>
  <TpoTeamMessageScroll highlightId={highlightId}/>
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
  <TpoTeamReplyComposer threadId={result.thread.id} actorUserId={context.user.id}/>
  {!result.messages.length?<p role="status" className="rounded-xl border border-border p-5 text-sm text-body">No messages in this thread yet.</p>:null}

 </main>;
}
