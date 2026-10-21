import { StatusBadge } from "@/components/ui/status-badge";
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
import {Button} from "@/components/ui/button";
import {Disclosure} from "@/components/ui/disclosure";
import {EmptyState} from "@/components/ui/empty-state";
/** User-facing acknowledgements belong to the interactive action controls,
 * not to this server-rendered conversation snapshot. Their verified response
 * outcomes map ADDED/OK/LEFT for participant/follow/mute/leave/topic actions
 * and EDITED/DELETED/DONE/CANCELLED for messages, decisions and team asks.
 * Do not invent a success toast on page load: an API mutation must first succeed.
 */
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
 if(result.status==="NOT_REGISTERED")return <div className="min-w-0 space-y-4">
   <PageHeader title="Conversations unavailable"/>
   <p role="status">Private messaging tables are not registered.</p>
   <Link href="/tpo/team" className="inline-flex min-h-11 min-[768px]:min-h-9 items-center text-link lms-inline-link">Back to team</Link>
 </div>;
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
 return <div className="min-w-0 space-y-4">
  <PageHeader title={result.thread.topic}
   description={"With "+result.thread.counterpartName+" · Private placement-team conversation."}
   actions={<Link href="/tpo/team?tab=conversations" className="inline-flex min-h-11 w-full items-center justify-center text-link lms-inline-link sm:w-auto min-[768px]:min-h-9">All conversations</Link>}/>
  <TpoLiveRefresh intervalMs={30000}/>
  <TpoTeamOpenRead threadId={result.thread.id}/>
  <Disclosure title="Conversation tools" className="min-w-0 border-b border-border" contentClassName="space-y-3 py-3">
  <TpoTeamRename threadId={result.thread.id} currentTopic={result.thread.topic}/>
  <TpoTeamThreadDetails threadId={result.thread.id} topic={result.thread.topic}
   counterpart={result.thread.counterpartName}
   createdDate={new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(result.thread.createdAt)}
   decisions={result.messages.filter(message=>message.decision&&!message.removed).length}
   openAsks={asks.status==="READY"?asks.items.filter(ask=>ask.status==="OPEN").length:0}
   awayLabel={awayLabel}/>
  <TpoTeamFollowControls threadId={result.thread.id} following={preferences.following}
   muted={preferences.muted} ready={preferences.status==="READY"}/>
  <form method="post" action={"/api/placements/tpo/team/threads/"+result.thread.id+"/acknowledge"}>
   <Button variant="secondary" type="submit" className="min-h-11 min-[768px]:min-h-9">
    Mark this conversation&apos;s alerts as read
   </Button>
  </form>
  </Disclosure>
  {result.messages.some(message=>message.decision&&!message.removed)?
   <aside aria-label="Decisions here" className="space-y-2 rounded-[var(--lms-control-radius)] border border-border bg-surface p-4">
    <h2 className="text-sm font-semibold">Decided:</h2>
    {result.messages.filter(message=>message.decision&&!message.removed).slice(-5).map(message=>
     <Link key={message.id} href={"#team-message-"+message.id}
      className="block truncate text-sm text-link underline">{message.body}</Link>)}
   </aside>:null}
  {result.messages.length===0?<EmptyState title="No messages in this thread yet." description="Reply privately to start the conversation."/>:null}
  <ol role="log" aria-live="polite" aria-busy={false} aria-label="Private team messages" className="min-w-0 space-y-3 border-t border-border pt-4">
   {result.messages.map((message,index)=>{
    const day=(date:Date)=>new Intl.DateTimeFormat("en-IN",{
     timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric",
    }).format(date);
    const own=message.authorMembershipId===context.membership?.id;
    const showDay=index===0||day(result.messages[index-1].createdAt)!==day(message.createdAt);
    return <li id={"team-message-"+message.id} key={message.id} className="min-w-0">
     {showDay?<p className="my-3 text-center text-xs font-semibold text-muted-foreground">{day(message.createdAt)}</p>:null}
     <div className={own?
      "ml-auto w-fit max-w-[94%] rounded-[var(--lms-control-radius)] rounded-br-sm border border-border bg-surface-secondary px-3 py-2 min-[768px]:max-w-[82%] min-[1024px]:max-w-[74%]":
      "mr-auto w-fit max-w-[94%] rounded-[var(--lms-control-radius)] rounded-bl-sm border border-border bg-surface px-3 py-2 min-[768px]:max-w-[82%] min-[1024px]:max-w-[74%]"}>
      <p className="text-xs text-muted-foreground">
       {own?"You":message.authorName?.trim()||"Team member"} ·
       {" "}{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",timeStyle:"short"}).format(message.createdAt)} IST
      </p>
      {message.decision&&!message.removed?<StatusBadge tone="success">Decision</StatusBadge>:null}
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
    className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-link">
    Older messages
   </Link> : null}
   {result.page > 1 ? <Link
    href={"/tpo/team/"+result.thread.id+"?page="+(result.page-1)}
    className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-link">
    Newer messages
   </Link> : null}
  </nav>
  <TpoTeamReplyComposer threadId={result.thread.id} actorUserId={context.user.id}/>
  {asks.status==="READY"?<TpoTeamAskPanel threadId={result.thread.id}
   actorId={context.membership?.id??""}
   recipientId={otherMembershipId}
   recipientAwayLabel={awayLabel}
   recipientName={result.thread.counterpartName}
   items={asks.items.map(ask=>({...ask,dueAt:ask.dueAt?.toISOString()??null}))}
   highlightAskId={highlightAskId} serverNowMs={serverNow.getTime()}/>:asks.status==="FAILED"?
   <p role="alert" className="text-sm text-error">Could not load team asks. Other messages are still available.</p>:null}

 </div>;
}
