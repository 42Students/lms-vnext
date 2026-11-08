import { StatusBadge } from "@/components/ui/status-badge";
import {listTpoTeamAsks} from "@/modules/placements/tpo-team-asks-service";
import {listTpoTeamAway} from "@/modules/placements/tpo-team-away-service";
import {getTpoPlacementTeam} from "@/modules/placements/tpo-settings-people-service";
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
import {ErrorState} from "@/components/ui/error-state";
import {AuthorizationError} from "@/modules/permissions/policy";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { istWeekdayDayMonthFormatter, istDateFormatter, istDayMonthYearFormatter } from "@/lib/format-date";
import { createDateFormatter } from "@/lib/format-date";
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
 if(Object.values(query).some(Array.isArray))return <div className="min-w-0 space-y-4">
  <PageHeader title="Team conversation" />
  <ErrorState title="Conflicting conversation filters"
   description="This link repeats a page or message reference. No private messages were loaded from the ambiguous link."
   action={<ButtonLink variant="secondary" href={"/tpo/team/"+encodeURIComponent(threadId)}>Clear conversation filters</ButtonLink>} />
 </div>;
 const rawPage=query.page;
 const parsedPage=tpoMessagePageSchema.safeParse(rawPage ?? 1);
 const rawMessage=Array.isArray(query.m)?query.m[0]:query.m;
 const highlightId=rawMessage&&tpoThreadIdSchema.safeParse(rawMessage).success?rawMessage:undefined;
 if(!parsedPage.success)notFound();
 const result=await readTpoInternalConversation(context,parsed.data,parsedPage.data).catch(error=>{
   if(error instanceof AuthorizationError)throw error;
   return null;
 });
 if(!result)return <div className="min-w-0 space-y-4">
   <PageHeader title="Team conversation"/>
   <ErrorState title="Could not load conversation" description="Previous messages were not changed."
     action={<TextLink href={"/tpo/team/"+encodeURIComponent(threadId)} className="inline-flex min-h-11 items-center">Retry</TextLink>}/>
  </div>;
 if(result.status==="NOT_FOUND")notFound();
 if(result.status==="NOT_REGISTERED")return <div className="min-w-0 space-y-4">
   <PageHeader title="Conversations unavailable"/>
   <p role="status">Private messaging tables are not registered.</p>
   <TextLink href="/tpo/team" className="inline-flex min-h-11 md:min-h-9 items-center">Back to team</TextLink>
 </div>;
 const preferences=await getTpoTeamThreadPreferences(context,parsed.data);
 const asks=await listTpoTeamAsks(context,parsed.data).catch(()=>({status:"FAILED" as const,items:[]}));
 const otherMembershipId=result.thread.startedByMembershipId===context.membership?.id?
  result.thread.invitedMembershipId:result.thread.startedByMembershipId;
 const away=await listTpoTeamAway(context).catch(()=>({ready:false as const,items:[]}));
 const teammates=await getTpoPlacementTeam(context,context.membership!.collegeId);
 const eligibleAssignees=teammates.members.filter(person=>
  (person.roles.includes("TPO")||person.roles.includes("COLLEGE_ADMIN"))&&
  person.membershipId!==context.membership?.id).map(person=>{
   const awayUntil=away.items.find(item=>item.membershipId===person.membershipId)?.awayUntil??null;
   return {membershipId:person.membershipId,displayName:person.displayName,
    awayLabel:awayUntil?istWeekdayDayMonthFormatter.format(awayUntil):null};
  });
 const awayUntil=away.items.find(row=>row.membershipId===otherMembershipId)?.awayUntil??null;
 const awayLabel=awayUntil?istWeekdayDayMonthFormatter.format(awayUntil):null;
 const rawAsk=Array.isArray(query.ask)?query.ask[0]:query.ask;
 const highlightAskId=rawAsk&&tpoThreadIdSchema.safeParse(rawAsk).success?rawAsk:undefined;
 const serverNow=new Date();
 return <div className="min-w-0 space-y-4">
  <PageHeader title={result.thread.topic}
   description={"With "+result.thread.counterpartName+" · Private topic"}
   actions={<TextLink href="/tpo/team?tab=conversations" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9">All conversations</TextLink>}/>
  <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-border pb-3">
   <StatusBadge tone="neutral">Private topic</StatusBadge>
   <StatusBadge tone="info">2 participants</StatusBadge>
   <StatusBadge tone="neutral">{result.thread.kind.replaceAll("_"," ")}</StatusBadge>
   <TextLink href={"/tpo/messages?tab=team&c="+encodeURIComponent(threadId)} className="ml-auto hidden min-h-9 items-center text-sm lg:inline-flex">Show beside conversations</TextLink>
  </div>
  <TpoLiveRefresh intervalMs={30000}/>
  <TpoTeamOpenRead threadId={result.thread.id}/>
  <section aria-label="Participants" className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-border bg-surface px-3 py-2">
   <div className="min-w-0 space-y-1">
    <Heading level={2} size="xs" className="uppercase tracking-wide text-muted-foreground">People here</Heading>
    <p className="text-sm text-body">You · {result.thread.counterpartName}</p>
   </div>
   <span className="text-xs text-muted-foreground">Private to the two members</span>
  </section>
  <Disclosure title="Conversation tools" className="min-w-0 border-b border-border" contentClassName="space-y-3 py-3">
  <TpoTeamRename threadId={result.thread.id} currentTopic={result.thread.topic}/>
  <p className="text-xs text-muted-foreground">This two-person conversation remains private. Opening it to the whole team and leaving a group conversation require multi-member topics; those controls are not offered for a private pair.</p>
  <TpoTeamThreadDetails threadId={result.thread.id} topic={result.thread.topic}
   counterpart={result.thread.counterpartName}
   createdDate={istDateFormatter.format(result.thread.createdAt)}
   decisions={result.messages.filter(message=>message.decision&&!message.removed).length}
   openAsks={asks.status==="READY"?asks.items.filter(ask=>ask.status==="OPEN").length:0}
   awayLabel={awayLabel}/>
  <TpoTeamFollowControls threadId={result.thread.id} following={preferences.following}
   muted={preferences.muted} ready={preferences.status==="READY"}/>
  <form method="post" action={"/api/placements/tpo/team/threads/"+result.thread.id+"/acknowledge"}>
   <Button variant="secondary" type="submit" className="min-h-11 md:min-h-9">
    Mark this conversation&apos;s alerts as read
   </Button>
  </form>
  </Disclosure>
  {result.messages.some(message=>message.decision&&!message.removed)?
   <aside aria-label="Decisions here" className="space-y-2 rounded-[var(--lms-control-radius)] border border-border bg-surface p-4">
    <Heading level={2} size="sm">Decided:</Heading>
    {result.messages.filter(message=>message.decision&&!message.removed).slice(-5).map(message=>
     <TextLink key={message.id} href={"#team-message-"+message.id}
      className="block truncate text-sm">{message.body}</TextLink>)}
   </aside>:null}
  {result.messages.length===0?<EmptyState title="No messages in this thread yet." description="Reply privately to start the conversation."/>:null}
  <ol role="log" aria-live="polite" aria-busy={false} aria-label="Private team messages" className="min-w-0 space-y-3 border-t border-border pt-4">
   {result.messages.map((message,index)=>{
    const day=(date:Date)=>istDayMonthYearFormatter.format(date);
    const own=message.authorMembershipId===context.membership?.id;
    const showDay=index===0||day(result.messages[index-1]?.createdAt ?? message.createdAt)!==day(message.createdAt);
    return <li id={"team-message-"+message.id} key={message.id} className="min-w-0">
     {showDay?<p className="my-3 text-center text-xs font-semibold text-muted-foreground">{day(message.createdAt)}</p>:null}
     <div className={own?
      "ml-auto w-fit max-w-[94%] rounded-[var(--lms-control-radius)] rounded-br-sm border border-border bg-surface-secondary px-3 py-2 md:max-w-[82%] lg:max-w-[74%]":
      "mr-auto w-fit max-w-[94%] rounded-[var(--lms-control-radius)] rounded-bl-sm border border-border bg-surface px-3 py-2 md:max-w-[82%] lg:max-w-[74%]"}>
      <p className="text-xs text-muted-foreground">
       {own?"You":message.authorName?.trim()||"Team member"} ·
       {" "}{createDateFormatter("en-IN", {timeZone:"Asia/Kolkata",timeStyle:"short"}).format(message.createdAt)} IST
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
  <TpoTeamMessageScroll {...(highlightId !== undefined ? {highlightId} : {})}/>
  <nav aria-label="Team message history pages" className="flex flex-wrap items-center gap-3 text-sm">
   <span className="text-body">Page {result.page} of {result.pages}</span>
   {result.page < result.pages ? <ButtonLink variant="secondary"
    href={"/tpo/team/"+result.thread.id+"?page="+(result.page+1)}>
    Older messages
   </ButtonLink> : null}
   {result.page > 1 ? <ButtonLink variant="secondary"
    href={"/tpo/team/"+result.thread.id+"?page="+(result.page-1)}>
    Newer messages
   </ButtonLink> : null}
  </nav>
  <TpoTeamReplyComposer threadId={result.thread.id} actorUserId={context.user.id}
   kind={result.thread.kind} mentionMembers={eligibleAssignees.map(member=>({
     membershipId:member.membershipId,displayName:member.displayName,
   }))}/>
  {asks.status==="READY"?<TpoTeamAskPanel threadId={result.thread.id}
   actorId={context.membership?.id??""}
   recipientId={otherMembershipId}
   recipientAwayLabel={awayLabel}
   recipientName={result.thread.counterpartName}
   eligibleAssignees={eligibleAssignees}
   items={asks.items.map(ask=>({...ask,dueAt:ask.dueAt?.toISOString()??null}))}
   {...(highlightAskId !== undefined ? {highlightAskId} : {})} serverNowMs={serverNow.getTime()}/>:asks.status==="FAILED"?
   <p role="alert" className="text-sm text-error">Could not load team asks. Other messages are still available.</p>:null}

 </div>;
}
