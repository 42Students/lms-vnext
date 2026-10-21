import { DateInput } from "@/components/ui/date-input";
import { StatTile } from "@/components/ui/stat-tile";
import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
import {Tabs} from "@/components/ui/tabs";
import {TpoRecruiterMessageReply} from "@/components/tpo/tpo-recruiter-message-reply";
import {getTpoRecruiterThreadDetail} from "@/modules/placements/tpo-recruiter-thread-detail-service";
import bubbleStyles from "@/components/tpo/tpo-conversation-bubble.module.css";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import {TpoLiveRefresh} from "@/components/tpo/tpo-live-refresh";
import { redirect } from "next/navigation";

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
import { AuthorizationError } from "@/modules/permissions/policy";

import {
  TPO_MESSAGE_STATUSES,
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

function labelStatus(status: string) {
  if (status === "EMPTY") return "No messages";

  return status.charAt(0) +
    status.slice(1).toLowerCase();
}

export default async function TpoMessagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }

  const now = new Date();
  const raw = await searchParams;
  if (first(raw.tab) === "team") redirect("/tpo/team?tab=conversations");

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
          description="Conversations with recruiters, one for each drive and a general one. Inside a drive, the same conversation is its Discussion tab."
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

  const result = await getTpoMessagesInbox(context, parsed.data).catch(error=>{
    if (error instanceof AuthorizationError) throw error;
    return null;
  });
  if (!result) return <div className="min-w-0 space-y-4">
    <PageHeader title="Messages" description="Conversations with recruiters, one for each drive and a general one. Inside a drive, the same conversation is its Discussion tab."/>
    <ErrorState title="Couldn&apos;t load conversations" description="This refresh failed. Retry."
      action={<Link href="/tpo/messages" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Retry</Link>}/>
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
    ? await listTpoMessageRecruiters(context) : [];

  const sourceLabel = isRecruiterInbox
    ? "Recruiter conversations"
    : "Placement notifications";
  // TPO-inbox-team-11: do not disguise notification deliveries as messages
  // when the recruiter-thread tables are not available.
  if(!isRecruiterInbox)return <div className="min-w-0 space-y-6">
   <PageHeader title="Messages"
    description="Conversations with recruiters, one for each drive and a general one. Inside a drive, the same conversation is its Discussion tab."/>
   <ErrorState title="Recruiter conversations are temporarily unavailable"
    description="Your placement notifications remain available separately. No recruiter messages were loaded."
    action={<Link href="/tpo/notifications"
      className="md:min-h-9 inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] border border-border px-4 font-semibold text-primary-text">
      Open notifications
     </Link>}/>
  </div>;


  const requestedThread=first(raw.thread);
  const selected=items.find(item=>item.id===requestedThread) ?? items[0] ?? null;
  const detail=selected && isRecruiterInbox
    ? await getTpoRecruiterThreadDetail(context,selected.id).catch(()=>null) : null;

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

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Messages"
        description="Conversations with recruiters, one for each drive and a general one. Inside a drive, the same conversation is its Discussion tab."
        actions={
          <div className="flex w-full flex-col items-stretch gap-2 min-[768px]:w-auto min-[768px]:flex-row min-[768px]:items-center">
            
            <details className="group relative min-w-0">
              <summary className="inline-flex min-h-11 w-full cursor-pointer list-none items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9 [&::-webkit-details-marker]:hidden">More TPO tools</summary>
              <nav aria-label="More TPO tools" className="mt-2 flex min-w-0 flex-col gap-2 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 min-[768px]:absolute min-[768px]:right-0 min-[768px]:z-20 min-[768px]:w-64">
                <Link href="/tpo/messages/notifications" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] px-3 text-sm font-semibold text-body hover:bg-primary-subtle hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">My placement notifications</Link>
                <Link href="/tpo/more" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] px-3 text-sm font-semibold text-body hover:bg-primary-subtle hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">More TPO tools</Link>
              </nav>
            </details>
          </div>
        }
      />
      <Tabs ariaLabel="Messages" renderPanel={false} value="recruiters" items={[
        {value:"recruiters",label:"Recruiters",href:"/tpo/messages"},
        {value:"team",label:"Team",href:"/tpo/team?tab=conversations"}]}/>
      <TpoLiveRefresh intervalMs={4000}/>

      <details className="min-w-0 border-b border-border pb-4">
        <summary className="min-h-9 cursor-pointer text-sm font-semibold text-body">Communication details</summary>
        <section role="status">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[16px] font-semibold leading-[26px] text-foreground min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">
            {sourceLabel}
          </h2>
          <StatusBadge
            tone={
              isRecruiterInbox
                ? "info"
                : "warning"
            }
          >
            {isRecruiterInbox
              ? "Conversations ready"
              : "Notifications only"}
          </StatusBadge>
        </div>

        {isRecruiterInbox ? (
          <p className="mt-2 text-sm leading-6 text-body">
            Open a recruiter conversation to read messages, reply, and keep the discussion with its placement drive.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-6 text-body">
            Recruiter conversations are temporarily unavailable. These are your placement notifications, not recruiter conversations.
          </p>
        )}

        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          This page shows messages and notifications recorded for your college.
        </p>
      </section>

      <section
        aria-label="Communication summary"
        className="grid min-w-0 grid-cols-2 gap-3 border-b border-border pb-4 min-[992px]:grid-cols-4"
      >
        {[
          {
            label: isRecruiterInbox
              ? "Conversation threads"
              : "Notification deliveries",
            value: summary.total,
          },
          {
            label: "Unread",
            value: summary.unread,
          },
          {
            label: "Read",
            value: summary.read,
          },
          {
            label: isRecruiterInbox
              ? "Threads without messages"
              : "Empty conversations",
            value: isRecruiterInbox
              ? summary.empty
              : "Not applicable",
          },
        ].map((metric) => (
          <StatTile key={metric.label} label={metric.label} value={metric.value} className={tpoTileStyles.tile+" !rounded-none !border-0 !bg-transparent !px-1 !py-2 !shadow-none"} />
        ))}
      </section>
      </details>

      <section className="border-b border-border pb-4">
        <details open={Boolean(query.from || query.to || pageSize !== 25)} className="group">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center text-[16px] font-semibold leading-[26px] text-foreground focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px] [&::-webkit-details-marker]:hidden">Communication filters <span aria-hidden="true" className="ml-2 text-primary-text group-open:rotate-180">⌄</span></summary>

        <form
          action="/tpo/messages"
          method="get"
          className="mt-3 grid min-w-0 items-end gap-[8px] min-[768px]:grid-cols-2 min-[992px]:grid-cols-5"
         aria-label="Filter messages">
          <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Status
            <Select
              name="status"
              defaultValue={query.status}
              className="min-h-11 md:min-h-9"
            >
              {TPO_MESSAGE_STATUSES.filter(
                (status) =>
                  isRecruiterInbox ||
                  status !== "EMPTY",
              ).map((status) => (
                <option
                  value={status}
                  key={status}
                >
                  {status === "ALL"
                    ? "All statuses"
                    : labelStatus(status)}
                </option>
              ))}
            </Select>
          </label>

          <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            From (IST)
            <DateInput mode="date"
              name="from"
              defaultValue={query.from ?? ""}
              className="min-h-11 md:min-h-9"
            />
          </label>

          <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            To (IST)
            <DateInput mode="date"
              name="to"
              defaultValue={query.to ?? ""}
              className="min-h-11 md:min-h-9"
            />
          </label>

          <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Search
            <Input type="search" name="q" maxLength={120} defaultValue={query.q} placeholder="Search recruiter or drive" className="min-h-11 md:min-h-9"/>
          </label>

          <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Page size
            <Select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="min-h-11 md:min-h-9"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Select>
          </label>

          <div className="flex flex-col gap-3 min-[768px]:col-span-2 min-[768px]:flex-row min-[992px]:col-span-5">
            <Button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius,9px)] bg-primary px-6 text-sm font-[650] text-on-primary hover:bg-primary-hover min-[768px]:min-h-9 min-[768px]:w-auto"
            >
              Apply filters
            </Button>

            <Link
              href="/tpo/messages"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text min-[768px]:min-h-9 min-[768px]:w-auto"
            >
              Clear filters
            </Link>
          </div>
        </form>
        </details>
      </section>

      <section aria-label="Recruiter messages inbox" className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-lg font-semibold">Recruiter conversations</h2>
          <span className="text-xs text-muted-foreground">{total} conversations · Most recent first · IST</span>
        </div>
        <div className="grid min-w-0 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border md:min-h-[520px] md:grid-cols-[minmax(260px,40%)_minmax(0,1fr)]">
          <aside aria-label="Conversation inbox" className="min-w-0 border-b border-border md:border-b-0 md:border-r">
            <div className="space-y-3 border-b border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">Inbox</h3>
                <TpoNewRecruiterConversation recruiters={availableRecruiters} actorUserId={context.user.id}/>
              </div>
              <nav aria-label="Recruiter inbox filters" className="flex min-w-0 flex-wrap gap-2">
                {([["ALL","All",summary.total],["REPLY","Reply",summary.reply],["UNREAD","Unread",summary.unread]] as const).map(([status,label,count])=>
                  <Link key={status} href={tpoMessagesHref({...commonFilters,status,page:1})}
                    aria-current={query.status===status?"page":undefined}
                    className={"inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] "+
                      (query.status===status?"border-primary bg-primary-subtle text-primary-text":"border-border text-body hover:border-primary hover:text-primary-text")}>
                    {label} ({count)}
                  </Link>)}
              </nav>
              <label className="grid gap-2 text-xs font-semibold text-muted-foreground">
                Search recruiter or drive
                <TpoInboxSearch value={query.q} placeholder="Search recruiter or drive"/>
              </label>
            </div>
            {items.length===0 ? <div className="p-4"><EmptyState
              title={query.q.trim()?"No conversations match this search.":"No conversations yet."}
              description={query.q.trim()?"Try another recruiter or drive.":"Start a new message to a recruiter."}/></div> :
              <ul className="divide-y divide-border">
                {items.map(item=>{
                  const href="/tpo/messages?"+new URLSearchParams({
                    status:query.status,page:String(page),pageSize:String(pageSize),
                    ...(query.q?{q:query.q}:{}),...(query.from?{from:query.from}:{}),
                    ...(query.to?{to:query.to}:{}),thread:item.id,
                  }).toString();
                  const active=selected?.id===item.id;
                  return <li key={item.id}>
                    <Link href={href} aria-current={active?"page":undefined}
                      aria-label={item.participantName+": "+item.subject}
                      className={"block min-h-14 px-4 py-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--lms-primary-text)] "+
                        (active?"bg-primary-subtle":"hover:bg-[var(--lms-primary-subtle)]")}>
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <strong className="truncate">{item.participantName}</strong>
                        <time dateTime={item.occurredAt.toISOString()} className="shrink-0 text-xs text-muted-foreground">{formatTpoInboxTime(item.occurredAt,now)}</time>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{item.companyName??"General conversation"} · {item.subject}</p>
                      {item.lastPreview?<p className="mt-1 line-clamp-2 break-words text-xs">{item.lastPreview}</p>:null}
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {item.status==="UNREAD"?<StatusBadge tone="info">Unread {item.unreadCount??""}</StatusBadge>:null}
                        {item.waitingForYou?<StatusBadge tone="warning">Waiting for you</StatusBadge>:null}
                        {item.accessEnded?<StatusBadge tone="neutral">Access ended</StatusBadge>:null}
                      </div>
                    </Link>
                  </li>;
                })}
              </ul>}
          </aside>
          <div aria-label="Selected conversation" className="min-w-0 space-y-4 p-4">
            {!selected?<EmptyState title="No conversations yet." description="Select a recruiter conversation to read and reply."/>:
              !detail?<ErrorState title="Could not load this conversation" description="This refresh failed. Retry."
                action={<Link href={"/tpo/messages/"+encodeURIComponent(selected.id)} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Retry</Link>}/>:
              <>
                <div className="border-b border-border pb-3">
                  <h3 className="text-lg font-semibold">{selected.participantName}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{selected.subject}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{detail.total} messages · Latest 100 · IST</p>
                </div>
                <div role="log" aria-label="Recruiter conversation messages" aria-live="polite" className="max-h-[520px] space-y-3 overflow-y-auto">
                  {detail.messages.length===0?<EmptyState title="No messages yet."/>:
                    detail.messages.map(message=><article key={message.id}
                      className={bubbleStyles.bubble+" "+(message.senderType==="TPO"?bubbleStyles.mine:"")}>
                      <p className="text-xs text-muted-foreground">
                        {message.senderType==="RECRUITER"?"Recruiter":"You"} · {" "}{formatTpoInboxTime(message.createdAt,now)}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm">{message.body}</p>
                    </article>)}
                </div>
                <TpoRecruiterMessageReply threadId={selected.id} actorUserId={context.user.id}
                  unread={detail.messages.some(message=>message.senderType==="RECRUITER"&&!message.readAt)}/>
                <Link href={"/tpo/messages/"+encodeURIComponent(selected.id)}
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">
                  Open full conversation →
                </Link>
              </>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Showing {rangeStart}–{rangeEnd} of {total}. Filters are scoped to the selected college.</p>
        <nav
          aria-label="Messages pagination"
          className="flex flex-col items-stretch gap-3 min-[768px]:flex-row min-[768px]:items-center min-[768px]:justify-between"
        >
          <p className="text-sm text-body">
            Page {page} of {Math.max(1, totalPages)}
          </p>

          <div className="flex w-full gap-2 min-[768px]:w-auto">
            {page > 1 ? (
              <Link
                href={tpoMessagesHref({
                  ...commonFilters,
                  page: page - 1,
                })}
                className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9 min-[768px]:flex-none"
              >
                Previous
              </Link>
            ) : null}

            {page < totalPages ? (
              <Link
                href={tpoMessagesHref({
                  ...commonFilters,
                  page: page + 1,
                })}
                className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9 min-[768px]:flex-none"
              >
                Next
              </Link>
            ) : null}
          </div>
        </nav>
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        Summary metrics cover the full authorized college scope
        of the selected source before filters are applied.
        Conversation unread status is derived from persisted
        recruiter-sent messages without a read timestamp;
        notification unread status is recipient-specific.
        They are distinct concepts and are never combined.
      </p>
    </div>
  );
}
