import { DateInput } from "@/components/ui/date-input";
import { TpoTeamMessagesDirectory } from "@/components/tpo/tpo-team-messages-directory";
import { StatTile } from "@/components/ui/stat-tile";
import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
import {DataTable} from "@/components/ui/data-table";
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
  const selectedTab=first(raw.tab)?.toLowerCase()??"recruiters";
  const tabs=(selected:"recruiters"|"team")=><nav role="tablist" aria-label="Messages" className="flex gap-2 border-b border-border pb-2">
    {(["recruiters","team"] as const).map(value=><Link role="tab" key={value}
      aria-selected={selected===value} href={"/tpo/messages?tab="+value}
      className={"inline-flex min-h-11 items-center border-b-[3px] px-4 text-sm font-semibold md:min-h-9 "+
        (selected===value?"border-primary text-link":"border-transparent text-body hover:text-link")}>
      {value==="recruiters"?"Recruiters":"Team"}
    </Link>)}
  </nav>;
  if(selectedTab==="team")return <div className="min-w-0 space-y-5">
    <PageHeader title="Messages" description="Recruiter conversations and private placement-team conversations in one place."/>
    {tabs("team")}
    <TpoTeamMessagesDirectory context={context} query={first(raw.q)??""}/>
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
  );

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
    description="Keep recruiter conversations tied to the right drive and follow up without leaving the placement workspace."/>
   {tabs("recruiters")}
   <ErrorState title="Recruiter conversations are temporarily unavailable"
    description="Your placement notifications remain available separately. No recruiter messages were loaded."
    action={<Link href="/tpo/notifications"
      className="md:min-h-9 inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] border border-border px-4 font-semibold text-primary-text">
      Open notifications
     </Link>}/>
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

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Messages"
        description="Keep recruiter conversations tied to the right drive and follow up without leaving the placement workspace."
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
      {tabs("recruiters")}
      <TpoLiveRefresh intervalMs={4000}/>

      <section
        role="status"
        className="border-b border-border pb-4"
      >
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

      {isRecruiterInbox ? <nav aria-label="Recruiter inbox filters" className="flex min-w-0 gap-2 overflow-x-auto pb-2 min-[768px]:flex-wrap min-[768px]:overflow-visible min-[768px]:pb-0">
        {([
          ["ALL","All",summary.total],
          ["REPLY","Reply",summary.reply],
          ["UNREAD","Unread",summary.unread],
        ] as const).map(([status,label,count])=><Link
          key={status}
          href={tpoMessagesHref({...commonFilters,status,page:1})}
          aria-current={query.status===status?"page":undefined}
          className={"inline-flex min-h-11 shrink-0 items-center rounded-[var(--lms-control-radius)] border px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-[var(--lms-control-height)] "+
            (query.status===status?"border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)] hover:bg-[var(--lms-primary-subtle)]":
              "border-border bg-surface text-body hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-text)]")}>
            {label} ({count})
          </Link>)}
      </nav> : null}
      <section className="border-b border-border pb-4">
        <details open={Boolean(query.from || query.to || query.q || pageSize !== 25)} className="group">
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
            {isRecruiterInbox?<TpoInboxSearch
              value={query.q} placeholder="Recruiter, subject or message"/>:
              <Input type="search" name="q" maxLength={120} defaultValue={query.q}
                placeholder="TPO name or event type"
                className="min-h-11 md:min-h-9"/>}
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

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {sourceLabel}
            </h2>
            <p className="mt-1 text-sm text-body">
              {total === 0
                ? "No matching persisted records"
                : rangeStart > total
                  ? `Page ${page} is beyond the available results`
                  : `Showing ${rangeStart}–${rangeEnd} of ${total} records`}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Most recent first · IST
          </p>
        </div>

        {items.length === 0 ? (
          <EmptyState
            action={<Link href="/tpo/messages" className="md:min-h-9 inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-body focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear filters</Link>}
            title="No matching communication records"
            description={
              isRecruiterInbox
                ? "No recruiter threads match these filters. Start a new conversation from Messages."
                : "No persisted TPO placement notifications match these filters. Recruiter conversations are currently unavailable, not confirmed empty."
            }
          />
        ) : (
          <DataTable
            caption="Recruiter conversation and notification records"
            rows={items}
            getRowKey={item=>item.id}
            empty={<EmptyState title="No matching communication records" description={
              isRecruiterInbox
                ?"No recruiter threads match these filters. Start a new conversation from Messages."
                :"No persisted TPO placement notifications match these filters. Recruiter conversations are currently unavailable, not confirmed empty."
            }/>}
            columns={[
              {key:"participant",header:isRecruiterInbox?"Recruiter":"TPO recipient",
               mobileLabel:isRecruiterInbox?"Recruiter":"TPO recipient",mobilePriority:"primary",
               cell:item=><div className="min-w-0">
                <strong className="break-words text-foreground">{item.participantName}</strong>
                {item.companyName?<p className="mt-1 text-xs text-muted-foreground">{item.companyName}</p>:null}
                {item.waitingForYou?<StatusBadge tone="warning" className="mr-2">Waiting for you</StatusBadge>:null}
                {item.accessEnded?<StatusBadge tone="neutral">Access ended</StatusBadge>:null}
               </div>},
              {key:"subject",header:"Subject",mobileLabel:"Subject",mobilePriority:"action",
               cell:item=><div className="min-w-0">
                {isRecruiterInbox?<Link className="inline-flex min-h-11 items-center break-words font-semibold text-primary-text underline"
                  href={"/tpo/messages/"+encodeURIComponent(item.id)}>{item.subject} →</Link>:
                 <span className="break-words text-body">{item.subject}</span>}
                {(query.q.trim()?item.searchSnippet??item.lastPreview:item.lastPreview)?
                  <p className="mt-1 line-clamp-2 break-words text-xs text-muted-foreground">{query.q.trim()?item.searchSnippet??item.lastPreview:item.lastPreview}</p>:null}
               </div>},
              {key:"status",header:"Status",mobileLabel:"Status",mobilePriority:"secondary",
               cell:item=><StatusBadge tone={item.status==="UNREAD"?"info":"neutral"}>{labelStatus(item.status)}</StatusBadge>},
              {key:"count",header:isRecruiterInbox?"Message records":"Record type",
               mobileLabel:isRecruiterInbox?"Message records":"Record type",mobilePriority:"secondary",
               cell:item=>isRecruiterInbox?<span>{item.messageCount??0} · {item.unreadCount??0} unread recruiter message records</span>:"In-app notification"},
              {key:"when",header:"Last activity",mobileLabel:"Last activity",mobilePriority:"secondary",
               cell:item=><time dateTime={item.occurredAt.toISOString()}>{formatTpoInboxTime(item.occurredAt,now)}</time>},
              {key:"context",header:"Context",mobileLabel:"Context",mobilePriority:"action",
               cell:item=>item.jobId?<Link href={"/tpo/placements/jobs/"+encodeURIComponent(item.jobId)}
                className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Open related job →</Link>:
                <span className="text-muted-foreground">{isRecruiterInbox?"General conversation":"Recipient notification"}</span>},
            ]}
          />
        )}

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
