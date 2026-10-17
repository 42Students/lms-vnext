import Link from "next/link";
import {listTpoTeamAsks} from "@/modules/placements/tpo-team-asks-service";
import {listTpoTeamAway} from "@/modules/placements/tpo-team-away-service";
import {TpoTeamAskPanel} from "@/components/tpo/tpo-team-ask-panel";
import {createHash} from "node:crypto";
import {tpoTeamCanEdit} from "@/modules/placements/tpo-team-message-change-model";
import {TpoTeamMessageActions} from "@/components/tpo/tpo-team-message-actions";
import {TpoTeamDecisionToggle} from "@/components/tpo/tpo-team-decision-toggle";
import {TpoTeamThreadDetails} from "@/components/tpo/tpo-team-thread-details";
import {TpoTeamOpenRead} from "@/components/tpo/tpo-team-open-read";
import {TpoTeamRename} from "@/components/tpo/tpo-team-rename";
import {TpoLiveRefresh} from "@/components/tpo/tpo-live-refresh";
import {TpoTeamReplyComposer} from "@/components/tpo/tpo-team-forms";
import {TpoTeamFollowControls} from "@/components/tpo/tpo-team-follow-controls";
import {getTpoTeamThreadPreferences} from "@/modules/placements/tpo-team-preferences-service";
import {TpoTeamMessageScroll} from "@/components/tpo/tpo-team-message-scroll";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import {hasPlacementTeamMembership} from "@/modules/placements/placement-team-access-model";
import { readTpoInternalConversation, tpoThreadIdSchema, tpoMessagePageSchema } from "@/modules/placements/tpo-team-conversation-service";
export default async function InternalThread({params,searchParams}:{params:Promise<{threadId:string}>;searchParams:Promise<{page?:string|string[];m?:string|string[];ask?:string|string[]}>}){
 const context=await getCurrentRequestContext();
 if(!hasPlacementTeamMembership(context))redirect("/dashboard");
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
 const asks=await listTpoTeamAsks(context,parsed.data).catch(()=>({status:"FAILED" as const,items:[]}));
 const otherMembershipId=result.thread.startedByMembershipId===context.membership?.id?
  result.thread.invitedMembershipId:result.thread.startedByMembershipId;
 const away=await listTpoTeamAway(context).catch(()=>({ready:false as const,items:[]}));
 const awayUntil=away.items.find(row=>row.membershipId===otherMembershipId)?.awayUntil??null;
 const awayLabel=awayUntil?new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",weekday:"short",day:"numeric",month:"short",
 }).format(awayUntil):null;
 const rawAsk=Array.isArray(query.ask)?query.ask[0]:query.ask;
 const highlightAskId=rawAsk&&tpoThreadIdSchema.safeParse(rawAsk).success?rawAsk:undefined;
 const serverNow=new Date();
 return <main className="space-y-5">
  <TpoLiveRefresh intervalMs={30000}/>
  <PageHeader eyebrow="TPO · Team" title={result.thread.topic}
   description={"With "+result.thread.counterpartName+" · Private placement-team conversation."}/>
  <Link href="/tpo/team?tab=conversations" className="inline-flex min-h-11 items-center text-primary-text">All conversations</Link>
  <TpoTeamOpenRead threadId={result.thread.id}/>
  <TpoTeamRename threadId={result.thread.id} currentTopic={result.thread.topic}/>
  <TpoTeamThreadDetails threadId={result.thread.id} topic={result.thread.topic}
   counterpart={result.thread.counterpartName}
   createdDate={new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(result.thread.createdAt)}
   decisions={result.messages.filter(message=>message.decision&&!message.removed).length}/>
  {asks.status==="READY"?<TpoTeamAskPanel threadId={result.thread.id}
   actorId={context.membership?.id??""}
   recipientId={otherMembershipId}
   recipientAwayLabel={awayLabel}
   recipientName={result.thread.counterpartName}
   items={asks.items.map(ask=>({...ask,dueAt:ask.dueAt?.toISOString()??null}))}
   highlightAskId={highlightAskId} serverNowMs={serverNow.getTime()}/>:asks.status==="FAILED"?
   <p role="alert" className="text-sm text-danger">Could not load team asks. Other messages are still available.</p>:null}
  <TpoTeamFollowControls threadId={result.thread.id} following={preferences.following}
   muted={preferences.muted} ready={preferences.status==="READY"}/>
  <form method="post" action={"/api/placements/tpo/team/threads/"+result.thread.id+"/acknowledge"}>
   <button type="submit"
    className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
    Mark this conversation&apos;s alerts as read
   </button>
  </form>
  {result.messages.some(message=>message.decision&&!message.removed)?
   <aside aria-label="Decisions here" className="space-y-2 rounded-lg border border-border bg-surface p-4">
    <h2 className="text-sm font-semibold">Decided:</h2>
    {result.messages.filter(message=>message.decision&&!message.removed).slice(-5).map(message=>
     <Link key={message.id} href={"#team-message-"+message.id}
      className="block truncate text-sm text-primary-text underline">{message.body}</Link>)}
   </aside>:null}
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
      {message.decision&&!message.removed?<span className="rounded border border-border px-2 py-0.5 text-xs font-semibold text-success">Decision</span>:null}
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">
       {message.removed?"Message removed":message.body}
      </p>
      {message.edited&&!message.removed?<span className="text-xs text-muted-foreground">edited</span>:null}
      {!message.removed?<TpoTeamDecisionToggle threadId={result.thread.id}
       messageId={message.id} marked={message.decision}/>:null}
      {own&&!message.removed?<TpoTeamMessageActions
       threadId={result.thread.id} messageId={message.id} body={message.body}
       expectedBodyHash={createHash("sha256").update(message.body).digest("hex")}
       canEdit={tpoTeamCanEdit(message.createdAt,serverNow)}/>:null}
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
