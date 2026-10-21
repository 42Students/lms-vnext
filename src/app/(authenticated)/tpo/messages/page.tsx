import { TpoTeamMessagesDirectory } from "@/components/tpo/tpo-team-messages-directory";
import Link from "next/link";
import {TpoRecruiterMessageReply} from "@/components/tpo/tpo-recruiter-message-reply";
import {getTpoRecruiterThreadDetail} from "@/modules/placements/tpo-recruiter-thread-detail-service";
import bubbleStyles from "@/components/tpo/tpo-conversation-bubble.module.css";
import {TpoLiveRefresh} from "@/components/tpo/tpo-live-refresh";
import { redirect } from "next/navigation";
import { AuthorizationError } from "@/modules/permissions/policy";

import { getCurrentRequestContext } from "@/auth/request-context";
import { formatTpoInboxTime } from "@/modules/placements/tpo-inbox-date-model";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { TpoNewRecruiterConversation } from "@/components/tpo/tpo-new-recruiter-conversation";
import {TpoInboxSearch} from "@/components/tpo/tpo-inbox-search";
import { listTpoMessageRecruiters } from "@/modules/placements/tpo-recruiter-message-recipients-service";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";

import {
  tpoMessagesHref,
} from "@/modules/placements/tpo-messages-model";
import {
  getTpoMessagesInbox,
  tpoMessagesQuerySchema,
} from "@/modules/placements/tpo-messages-service";

type SearchParams = {
  tab?: string | string[];
  thread?: string | string[];
  status?: string | string[];
  from?: string | string[];
  to?: string | string[];
  q?: string | string[];
  about?: string | string[];
  c?: string | string[];
  m?: string | string[];
  ask?: string | string[];
  filter?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
};

function first(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0]
    : value;
}

export default async function TpoMessagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  const raw = await searchParams;
  const selectedTab=first(raw.tab)?.toLowerCase()??"recruiters";
  if (!context.membership ||
      (selectedTab==="team" ? !hasPlacementTeamMembership(context) :
       !hasMembershipRole(context,"TPO"))) {
    redirect("/dashboard");
  }

  const now = new Date();
  const tabs=(selected:"recruiters"|"team")=><nav role="tablist" aria-label="Messages" className="flex gap-2 border-b border-border pb-2">
    {(["recruiters","team"] as const).map(value=><Link role="tab" key={value}
      aria-selected={selected===value} href={"/tpo/messages?tab="+value}
      className={"inline-flex min-h-11 items-center border-b-[3px] px-4 text-sm font-semibold md:min-h-9 "+
        (selected===value?"border-primary text-link":"border-transparent text-body hover:text-link")}>
      {value==="recruiters"?"Recruiters":"Team"}
    </Link>)}
  </nav>;
  // Team talk deep links use the old about=COMPANY:<normalized company> topic.
  // It is a search among authorized threads, not a public thread locator.
  const about=first(raw.about)??"";
  const companySearch=about.startsWith("COMPANY:")?about.slice("COMPANY:".length).trim().slice(0,120):"";
  if(selectedTab==="team")return <div className="min-w-0 space-y-5">
    <PageHeader title="Messages" description="Your placement team's own conversations: who does what, and what you decided. Recruiters and students never see these."/>
    {tabs("team")}
    {companySearch?<p role="status" className="text-sm text-body">Team conversations about {companySearch} · <Link href="/tpo/messages?tab=team" className="font-semibold text-link underline">Clear topic</Link></p>:null}
    <TpoTeamMessagesDirectory context={context} query={companySearch||(first(raw.q)??"")}
      selectedId={first(raw.c)} messageId={first(raw.m)} askId={first(raw.ask)} filter={first(raw.filter)}/>
  </div>;
  if(selectedTab!=="recruiters")return <div className="min-w-0 space-y-4">
    <PageHeader title="Messages"/>
    <ErrorState title="Invalid Messages tab" description="Choose Recruiters or Team."
      action={<Link href="/tpo/messages" className="font-semibold text-link underline">Recruiters</Link>}/>
  </div>;

  const parsed = tpoMessagesQuerySchema.safeParse({
    status: first(raw.status) || undefined,
    from: first(raw.from) || undefined,
    to: first(raw.to) || undefined,
    q: first(raw.q) || undefined,
    page: first(raw.page) || undefined,
    pageSize: first(raw.pageSize) || undefined,
  });

  if (!parsed.success) {
    return (
      <div className="min-w-0 space-y-6">
        <PageHeader
          title="Messages"
          description="Keep recruiter conversations tied to the right drive and follow up without leaving the placement workspace."
        />
        <ErrorState
          title="Invalid message filters"
          description="Check status, date range, search and pagination values. No communication data was loaded."
          action={
            <Link
              href="/tpo/messages"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text min-[768px]:min-h-9 min-[768px]:w-auto"
            >
              Clear filters
            </Link>
          }
        />
      </div>
    );
  }

  const result = await getTpoMessagesInbox(
    context,
    parsed.data,
  ).catch(error=>{
    if(error instanceof AuthorizationError)throw error;
    return null;
  });
  if (!result) return <div className="min-w-0 space-y-4">
    <PageHeader title="Messages" description="Conversations with recruiters, one for each drive and a general one. Inside a drive, the same conversation is its Discussion tab."/>
    {tabs("recruiters")}
    <ErrorState title="Could not load conversations" description="This refresh failed. The recruiter inbox could not be verified; no existing messages have been changed."
      action={<Link href="/tpo/messages" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>}/>
  </div>;

  const {
    query,
    source,
    summary,
    items,
    page,
    pageSize,
    totalPages,
    total,
  } = result;

  const isRecruiterInbox =
    source === "RECRUITER_THREADS";
  const availableRecruiters = isRecruiterInbox
    ? await listTpoMessageRecruiters(context).catch(()=>null) : [];
  const recipientsUnavailable=isRecruiterInbox&&availableRecruiters===null;

  const sourceLabel = isRecruiterInbox
    ? "Recruiter conversations"
    : "Placement notifications";
  // TPO-inbox-team-11: do not disguise notification deliveries as messages
  // when the recruiter-thread tables are not available.
  if(!isRecruiterInbox)return <div className="min-w-0 space-y-6">
   <PageHeader title="Messages"
    description="Keep recruiter conversations tied to the right drive and follow up without leaving the placement workspace."/>
   {tabs("recruiters")}
   <ErrorState title="Could not load conversations"
    description="Recruiter conversations are unavailable. Placement notifications remain separate and this does not mean your conversations were deleted."
    action={<div className="flex flex-wrap gap-3">
      <Link href="/tpo/messages" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>
      <Link href="/tpo/notifications" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Open notifications</Link>
    </div>}/>
  </div>;


  const rangeStart =
    total === 0
      ? 0
      : (page - 1) * pageSize + 1;

  const rangeEnd = Math.min(
    total,
    page * pageSize,
  );

  const commonFilters = {
    status: query.status,
    from: query.from,
    to: query.to,
    q: query.q,
    pageSize,
  };

  const requested=first(raw.thread);
  const active=items.find(item=>item.id===requested)??(!requested?items[0]:undefined);
  const detail=active?await getTpoRecruiterThreadDetail(context,active.id).catch(()=>null):null;
  const threadHref=(id:string)=>{
    const search=new URLSearchParams();
    if(query.status!=="ALL")search.set("status",query.status);
    if(query.from)search.set("from",query.from);
    if(query.to)search.set("to",query.to);
    if(query.q)search.set("q",query.q);
    if(page>1)search.set("page",String(page));
    if(pageSize!==25)search.set("pageSize",String(pageSize));
    search.set("thread",id);
    return "/tpo/messages?"+search.toString();
  };
  const narrowing=Boolean(query.q||query.from||query.to||query.status!=="ALL");
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Messages" description="Conversations with recruiters, one for each drive and a general one. Inside a drive, the same conversation is its Discussion tab."/>
    <section className="min-w-0 rounded-xl border border-border bg-surface p-4 md:p-6">
      {tabs("recruiters")}
      <TpoLiveRefresh intervalMs={4000}/>
      {recipientsUnavailable?<p role="alert" className="border-l-2 border-warning bg-warning-subtle px-3 py-2 text-sm">The recruiter directory could not refresh. Existing conversations remain available; starting a new conversation is temporarily unavailable. <Link href="/tpo/messages" className="font-semibold text-link underline">Retry</Link></p>:null}
      <div role="tabpanel" aria-label="Recruiter conversations"
        className="mt-4 grid min-w-0 overflow-hidden rounded-lg border border-border lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <aside aria-label="Recruiter inbox" className="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
          <div className="space-y-3 border-b border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground">Inbox</h2>
              {!recipientsUnavailable?<TpoNewRecruiterConversation recruiters={availableRecruiters??[]} actorUserId={context.user.id}/>:null}
            </div>
            <nav aria-label="Recruiter inbox filters" className="flex flex-wrap gap-2">
              {([["ALL","All",summary.total],["REPLY","Reply",summary.reply],["UNREAD","Unread",summary.unread]] as const)
                .map(([status,label,count])=><Link key={status}
                  href={tpoMessagesHref({...commonFilters,status,page:1})}
                  aria-current={query.status===status?"page":undefined}
                  className={"inline-flex min-h-10 items-center rounded-lg border px-3 text-sm font-semibold "+
                    (query.status===status?"border-primary bg-primary-subtle text-primary-text":"border-border text-body hover:bg-primary-subtle")}>
                  {label} ({count})
                </Link>)}
            </nav>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Search recruiter or drive</label>
              <TpoInboxSearch value={query.q} placeholder="Search recruiter or drive"/>
            </div>
            <p className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{summary.unread} unread · {total} conversations</span>
              {narrowing?<Link href="/tpo/messages" className="font-semibold text-link underline">Clear filters</Link>:null}
            </p>
          </div>
          {items.length===0?<div className="p-4">
            <EmptyState title={narrowing?"No conversations match this search":"No conversations yet"}
              description={narrowing?"Try a different search or choose All.":"Start a new message to a recruiter."}/>
          </div>:<ul className="max-h-[65vh] divide-y divide-border overflow-y-auto lg:max-h-[680px]">
            {items.map(item=><li key={item.id}>
              <Link href={threadHref(item.id)}
                aria-label={item.participantName+" — "+item.subject}
                aria-current={active?.id===item.id?"page":undefined}
                className={"flex min-h-16 gap-3 px-4 py-3 hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-primary "+
                  (active?.id===item.id?"bg-primary-subtle":"")}>
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-body">
                  {item.participantName.slice(0,1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <strong className="truncate text-sm text-foreground">{item.participantName}</strong>
                    <time className="shrink-0 text-xs text-muted-foreground" dateTime={item.occurredAt.toISOString()}>
                      {formatTpoInboxTime(item.occurredAt,now)}
                    </time>
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{item.companyName??"General conversation"} · {item.subject}</span>
                  <span className="mt-1 block truncate text-sm text-body">{item.searchSnippet??item.lastPreview??"No messages yet"}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {(item.unreadCount??0)>0?<StatusBadge tone="info">{item.unreadCount} unread</StatusBadge>:null}
                    {item.waitingForYou?<StatusBadge tone="warning">Waiting for you</StatusBadge>:null}
                    {item.accessEnded?<StatusBadge tone="neutral">Access ended</StatusBadge>:null}
                  </span>
                </span>
              </Link>
            </li>)}
          </ul>}
          {totalPages>1?<nav aria-label="Messages pagination" className="flex items-center justify-between gap-2 border-t border-border p-3 text-sm">
            {page>1?<Link href={tpoMessagesHref({...commonFilters,page:page-1})} className="font-semibold text-link underline">Previous</Link>:<span/>}
            <span>Page {page} of {totalPages}</span>
            {page<totalPages?<Link href={tpoMessagesHref({...commonFilters,page:page+1})} className="font-semibold text-link underline">Next</Link>:<span/>}
          </nav>:null}
        </aside>
        <section aria-label="Conversation" className="min-w-0 p-4 md:p-5">
          {!active?<EmptyState title={requested?"Conversation not on this page":"No conversations yet"} description={requested?"Clear the thread selection or change filters to find this conversation.":"Select a conversation or start a new message."}/>:
            !detail?<ErrorState title="Could not load this conversation"
              description="This refresh failed. Retry. No messages were acknowledged."
              action={<Link href={threadHref(active.id)} className="font-semibold text-link underline">Retry</Link>}/>:
            <>
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{active.participantName}</h2>
                  <p className="text-sm text-muted-foreground">{active.companyName??"Recruiter"} · {active.subject}</p>
                </div>
                <Link href={"/tpo/messages/"+encodeURIComponent(active.id)} className="inline-flex min-h-10 items-center font-semibold text-link underline">
                  Open full conversation
                </Link>
              </div>
              <div role="log" aria-live="polite" aria-label="Conversation messages" className="max-h-[480px] space-y-3 overflow-y-auto py-4">
                {detail.messages.length===0?<EmptyState title="No messages yet."/>:
                  detail.messages.map(item=><article key={item.id}
                    className={bubbleStyles.bubble+" "+(item.senderType==="TPO"?bubbleStyles.mine:"")}>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {item.senderType==="RECRUITER"?"Recruiter":"You"} · {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(item.createdAt)} IST
                    </p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">{item.body}</p>
                  </article>)}
              </div>
              <TpoRecruiterMessageReply threadId={active.id} actorUserId={context.user.id}
                unread={detail.messages.some(item=>item.senderType==="RECRUITER"&&!item.readAt)}/>
            </>}
        </section>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Recruiter conversations are separate from placement notifications. {sourceLabel}: {rangeStart}–{rangeEnd} of {total} records.</p>
    </section>
  </div>;
}
