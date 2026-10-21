import Link from "next/link";
import {listMyTpoInternalThreads} from "@/modules/placements/tpo-team-internal-read-service";
import {readTpoInternalConversation,tpoThreadIdSchema} from "@/modules/placements/tpo-team-conversation-service";
import {getTpoPlacementTeam} from "@/modules/placements/tpo-settings-people-service";
import {readTpoTeamEveryone} from "@/modules/placements/tpo-team-everyone-service";
import {TpoEveryoneControls} from "@/components/tpo/tpo-everyone-controls";
import {listTpoTeamAsks} from "@/modules/placements/tpo-team-asks-service";
import {TpoTeamOpenRead} from "@/components/tpo/tpo-team-open-read";
import {TpoLiveRefresh} from "@/components/tpo/tpo-live-refresh";
import {TpoTeamThreadCreate,TpoTeamReplyComposer} from "@/components/tpo/tpo-team-forms";
import {TpoTeamSearch} from "@/components/tpo/tpo-team-search";
import {StatusBadge} from "@/components/ui/status-badge";
import {EmptyState} from "@/components/ui/empty-state";
import {ErrorState} from "@/components/ui/error-state";
import type {RequestContext} from "@/modules/identity/context";

const FILTERS = [
 ["following","Following"],["all","All"],["me","@ Me"],["asks","Asks"],
 ["decisions","Decisions"],["drives","Drives"],["companies","Companies"],
 ["topics","Topics"],
] as const;
type TeamFilter = (typeof FILTERS)[number][0];

function selectedFilter(value:string):TeamFilter {
 return FILTERS.find(([key])=>key===value)?.[0]??"following";
}

function threadTime(value:Date, now:Date) {
 const day = (date:Date)=>new Intl.DateTimeFormat("en-CA",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
 }).format(date);
 if(day(value)===day(now))return new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",hour:"numeric",minute:"2-digit",hour12:true,
 }).format(value);
 const yesterday=new Date(now.getTime()-86400000);
 if(day(value)===day(yesterday))return "Yesterday";
 if(now.getTime()-value.getTime()<6*86400000)return new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",weekday:"short",
 }).format(value);
 return new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",day:"numeric",month:"short",
 }).format(value);
}

/** The old Team URL redirects here: there must be only one Messages workspace.
 * The wide layout keeps the inbox, conversation and context in one place;
 * on phone an explicit selection shows the conversation with a back link.
 */
export async function TpoTeamMessagesDirectory({
 context,query,filter,selectedId,messageId,askId,page=1,
}:{
 context:RequestContext;query:string;filter?:string;selectedId?:string;
 messageId?:string;askId?:string;page?:number;
}){
 const member=context.membership;
 if(!member)return null;
 const safeQuery=query.trim().slice(0,120);
 const view=selectedFilter(filter??"following");
 const safePage=Number.isSafeInteger(page)?Math.min(1000,Math.max(1,page)):1;
 const data=await listMyTpoInternalThreads(context,safeQuery,safePage).catch(()=>null);
 if(!data||data.status!=="READY")return <ErrorState title="Could not load conversations"
  description="Team conversations are temporarily unavailable. The Recruiters tab remains accessible."
  action={<Link href="/tpo/messages?tab=team" className="font-semibold text-link underline">Retry</Link>}/>;
 const all=data.items;
 const visible=safeQuery.length>=2?all:all.filter(item=>{
  if(view==="all")return true;
  if(view==="following")return item.following;
  if(view==="me")return item.asksForMe>0||item.unreadCount>0;
  if(view==="asks")return item.openAsks>0;
  if(view==="decisions")return item.hasDecisions;
  if(view==="drives")return item.kind==="DRIVE";
  if(view==="companies")return item.kind==="COMPANY";
  return item.kind==="TOPIC";
 });
 const requested=selectedId&&tpoThreadIdSchema.safeParse(selectedId).success?selectedId:undefined;
 const explicit=Boolean(requested||selectedId==="everyone");
 const unreadCandidate=visible.find(item=>item.following&&item.unreadCount>0);
 // Legacy desktop opens a followed unread conversation first, then Everyone.
 // Mobile keeps the list until a conversation is deliberately selected.
 const showEveryone=selectedId==="everyone"||(!requested&&!unreadCandidate);
 const pickedId=showEveryone?undefined:requested??unreadCandidate?.id??visible[0]?.id;
 const everyone=showEveryone?await readTpoTeamEveryone(context).catch(()=>null):null;
 const conversation=pickedId?await readTpoInternalConversation(context,pickedId).catch(()=>null):null;
 const active=conversation?.status==="READY"?conversation:null;
 const asks=active?await listTpoTeamAsks(context,active.thread.id).catch(()=>null):null;
 const roster=await getTpoPlacementTeam(context,member.collegeId).catch(()=>null);
 const colleagues=roster?.members.filter(row=>row.membershipId!==member.id)
  .map(row=>({membershipId:row.membershipId,displayName:row.displayName}))??[];
 const href=(id?:string,nextFilter:TeamFilter=view,nextPage=1)=>{
  const params=new URLSearchParams({tab:"team"});
  if(safeQuery.length>=2)params.set("q",safeQuery);
  if(nextFilter!=="following")params.set("filter",nextFilter);
  if(id)params.set("c",id);
  if(nextPage>1)params.set("page",String(nextPage));
  return "/tpo/messages?"+params.toString();
 };
 const displayedCount=visible.length;
 const today=new Date();
 return <section role="tabpanel" aria-label="Team conversations" className="min-w-0">
  <TpoLiveRefresh intervalMs={30000}/>
  <div className="grid min-w-0 overflow-hidden rounded-[var(--lms-control-radius)] border border-border bg-surface lg:grid-cols-[minmax(250px,300px)_minmax(0,1fr)] xl:grid-cols-[minmax(250px,290px)_minmax(0,1fr)_minmax(200px,240px)]">
   <aside aria-label="Conversations" className={(explicit?"hidden lg:block ":"block ")+"min-w-0 border-b border-border lg:border-b-0 lg:border-r"}>
    <div className="space-y-3 border-b border-border p-3">
     <div className="flex items-center justify-between gap-2">
      <h2 className="text-lg font-semibold text-foreground">Team conversations</h2>
      <a href="#new-team-conversation" className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link" aria-label="New conversation">+ New</a>
     </div>
     <TpoTeamSearch value={safeQuery}/>
     <nav aria-label="Show team conversations" className="flex flex-wrap gap-1.5">
      {FILTERS.map(([key,label])=><Link key={key} href={href(undefined,key)}
       aria-current={view===key?"page":undefined}
       className={"inline-flex min-h-9 items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold "+
        (view===key?"border-primary bg-primary-subtle text-primary-text":"border-border text-body hover:bg-primary-subtle")}>
       {label}
      </Link>)}
     </nav>
     <p className="text-xs text-muted-foreground">{displayedCount} {displayedCount===1?"conversation":"conversations"} shown on this page{data.hasMore?" · More results available":""}</p>
    </div>
    {safeQuery.length<2?<Link href={href("everyone")} aria-current={showEveryone?"page":undefined}
     className={"flex min-h-16 items-center gap-3 border-b border-border px-3 py-3 hover:bg-primary-subtle "+
      (showEveryone?"bg-primary-subtle":"")}>
     <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-secondary text-lg">↗</span>
     <span className="flex-1"><strong className="block text-sm text-foreground">Everyone</strong>
      <span className="block text-xs text-muted-foreground">The placement team channel</span></span>
    </Link>:null}
    {visible.length===0?<div className="p-4"><EmptyState
      title={safeQuery.length>=2?"Nothing matches. Try other words.":view==="following"?"You follow nothing else yet. All shows every conversation.":"Nothing here. Try All."}
      description={view==="following"?"Choose All to see your other conversations.":"Try a different filter or search."}/></div>:
    <ul className="max-h-[65vh] divide-y divide-border overflow-y-auto">
     {visible.map(item=><li key={item.id}>
      <Link href={href(item.id)} aria-current={pickedId===item.id?"page":undefined}
       className={"flex min-h-16 gap-2 px-3 py-3 focus-visible:outline-2 focus-visible:outline-primary hover:bg-primary-subtle "+
        (pickedId===item.id?"bg-primary-subtle":"")}>
       <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-secondary text-xs font-semibold">
        {item.kind==="COMPANY"?"C":item.kind==="DRIVE"?"D":item.kind==="TOPIC"?"#":"T"}
       </span>
       <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-1">
         <strong className="truncate text-sm text-foreground">{item.topic}</strong>
         <time className="shrink-0 text-[11px] text-muted-foreground" dateTime={item.lastActivityAt.toISOString()}>{threadTime(item.lastActivityAt,today)}</time>
        </span>
        <span className="block truncate text-xs text-muted-foreground">{item.searchSnippet??item.lastPreview??"No messages yet"}</span>
        <span className="mt-1 flex flex-wrap gap-1">
         {item.unreadCount>0?<StatusBadge tone="info">{item.unreadCount} unread</StatusBadge>:null}
         {item.asksForMe>0?<StatusBadge tone="warning">@ Me · {item.asksForMe}</StatusBadge>:null}
        </span>
       </span>
      </Link>
     </li>)}
    </ul>}
    {data.hasMore||safePage>1?<nav aria-label="Team conversation pages" className="flex items-center justify-between border-t border-border p-3 text-xs font-semibold">
     {safePage>1?<Link href={href(undefined,view,safePage-1)} className="text-link underline">Previous</Link>:<span/>}
     <span>Page {safePage}</span>
     {data.hasMore?<Link href={href(undefined,view,safePage+1)} className="text-link underline">Next</Link>:<span/>}
    </nav>:null}
    <details id="new-team-conversation" className="border-t border-border p-3">
     <summary className="cursor-pointer text-sm font-semibold text-link">+ New conversation</summary>
     {colleagues.length>0?<TpoTeamThreadCreate members={colleagues} actorUserId={context.user.id}/>:
      <p className="mt-3 text-sm text-muted-foreground">No other active placement-team colleague is available.</p>}
    </details>
   </aside>
   <section aria-label="Selected team conversation"
    className={(explicit?"block ":"hidden lg:block ")+"min-w-0 px-4 py-4 md:px-5"}>
    {explicit?<Link href={href()} className="mb-3 inline-flex min-h-9 items-center text-sm font-semibold text-link lg:hidden">← All conversations</Link>:null}
    {showEveryone?
     !everyone?<ErrorState title="Could not load Everyone" description="The placement team channel could not be loaded."
      action={<Link href={href("everyone")} className="font-semibold text-link underline">Retry</Link>}/>:
     everyone.status!=="READY"?<EmptyState title="Everyone is unavailable" description="The placement team channel needs its registered storage."/>:
     <>
      <header className="mb-3 border-b border-border pb-3">
       <h3 className="text-lg font-semibold text-foreground">Everyone</h3>
       <p className="text-xs text-muted-foreground">Everyone on the placement team can read this conversation.</p>
      </header>
      {everyone.rows.length===0?<EmptyState title="No messages in Everyone yet." description="Write the first message below."/>:
       <ol role="log" aria-label="Everyone messages" aria-live="polite" className="max-h-[55vh] space-y-3 overflow-y-auto py-2">
        {everyone.rows.map(item=><li key={item.id} className={item.authorMembershipId===member.id?"ml-auto max-w-[92%]":"mr-auto max-w-[92%]"}>
         <div className="rounded-[var(--lms-control-radius)] border border-border bg-surface-secondary px-3 py-2">
          <p className="text-xs text-muted-foreground">{item.authorMembershipId===member.id?"You":item.authorName??"Team member"} · {threadTime(item.createdAt,today)}</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-body">{item.body}</p>
         </div>
        </li>)}
       </ol>}
      {everyone.pages>1?<Link href="/tpo/team/everyone" className="my-2 inline-flex min-h-9 items-center text-sm font-semibold text-link underline">View older Everyone messages</Link>:null}
      <TpoEveryoneControls muted={everyone.muted} actorUserId={context.user.id}/>
     </>:
     !pickedId?<EmptyState title="Pick a conversation, or start one with +."/>:
     !conversation?<ErrorState title="Could not load this conversation" description="This refresh failed. No messages have been marked read."
      action={<Link href={href(pickedId)} className="font-semibold text-link underline">Retry</Link>}/>:
     !active?<ErrorState title="Conversation unavailable" description="This conversation is no longer accessible in the current college or role."
      action={<Link href={href()} className="font-semibold text-link underline">All conversations</Link>}/>:
     <>
      <TpoTeamOpenRead threadId={active.thread.id}/>
      <header className="mb-3 border-b border-border pb-3">
       <h3 className="text-lg font-semibold text-foreground">{active.thread.topic}</h3>
       <p className="text-xs text-muted-foreground">With {active.thread.counterpartName} · Private placement-team conversation</p>
       <Link href={"/tpo/team/"+active.thread.id+(askId?"?ask="+encodeURIComponent(askId):"")}
        className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-link underline">Open full conversation and asks</Link>
      </header>
      {active.messages.length===0?<EmptyState title="No messages in this conversation yet."/>:
       <ol role="log" aria-label="Team messages" aria-live="polite" className="max-h-[55vh] space-y-3 overflow-y-auto py-2">
        {active.messages.map(item=><li key={item.id} id={"team-message-"+item.id}
         className={item.authorMembershipId===member.id?"ml-auto max-w-[92%]":"mr-auto max-w-[92%]"}>
         <div className="rounded-[var(--lms-control-radius)] border border-border bg-surface-secondary px-3 py-2">
          <p className="text-xs text-muted-foreground">{item.authorMembershipId===member.id?"You":item.authorName??"Team member"} · {threadTime(item.createdAt,today)}</p>
          {item.decision&&!item.removed?<StatusBadge tone="success">Decision</StatusBadge>:null}
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-body">{item.removed?"Message removed":item.body}</p>
         </div>
        </li>)}
       </ol>}
      {messageId&&tpoThreadIdSchema.safeParse(messageId).success?
       <p className="my-2 text-xs text-muted-foreground"><a href={"#team-message-"+messageId} className="text-link underline">Jump to linked message</a></p>:null}
      <TpoTeamReplyComposer threadId={active.thread.id} actorUserId={context.user.id}/>
     </>}
   </section>
   <aside aria-label="Conversation details" className="hidden min-w-0 border-l border-border p-4 xl:block">
    {showEveryone?<div className="space-y-3 text-sm">
     <h3 className="font-semibold text-foreground">About Everyone</h3>
     <p>Everyone in this college's active placement team can read the channel.</p>
     <p>Recruiters and students never see these conversations.</p>
     <Link href="/tpo/team/everyone" className="inline-flex min-h-9 items-center font-semibold text-link underline">Channel history and settings</Link>
    </div>:active?<div className="space-y-3 text-sm">
     <h3 className="font-semibold text-foreground">About this conversation</h3>
     <dl className="space-y-3">
      <div><dt className="text-xs text-muted-foreground">Topic</dt><dd className="break-words">{active.thread.topic}</dd></div>
      <div><dt className="text-xs text-muted-foreground">With</dt><dd>{active.thread.counterpartName}</dd></div>
      <div><dt className="text-xs text-muted-foreground">Started</dt><dd>{threadTime(active.thread.createdAt,today)} IST</dd></div>
      <div><dt className="text-xs text-muted-foreground">Decisions here</dt><dd>{active.messages.filter(item=>item.decision&&!item.removed).length}</dd></div>
     </dl>
     {active.messages.some(message=>message.decision&&!message.removed)?<div>
      <h4 className="mb-2 text-xs font-semibold text-muted-foreground">Decided:</h4>
      {active.messages.filter(message=>message.decision&&!message.removed).slice(-5).map(message=>
       <a key={message.id} href={"#team-message-"+message.id} className="my-1 block truncate text-sm text-link underline">{message.body}</a>)}
     </div>:null}
     {asks?.status==="READY"&&asks.items.some(ask=>ask.status==="OPEN")?<div>
      <h4 className="mb-2 text-xs font-semibold text-muted-foreground">Open asks</h4>
      {asks.items.filter(ask=>ask.status==="OPEN").slice(0,5).map(ask=>
       <Link key={ask.id} href={"/tpo/team/"+active.thread.id+"?ask="+encodeURIComponent(ask.id)}
        className="my-1 block break-words text-sm text-link underline">{ask.title}</Link>)}
     </div>:asks?.status==="NOT_REGISTERED"?
      <p className="text-xs text-muted-foreground">Team asks are unavailable until the database is registered.</p>:null}
     <Link href={"/tpo/team/"+active.thread.id} className="inline-flex min-h-9 items-center font-semibold text-link underline">Details, people and asks</Link>
    </div>:<p className="text-sm text-muted-foreground">Choose a conversation to see its context.</p>}
   </aside>
  </div>
 </section>;
}
