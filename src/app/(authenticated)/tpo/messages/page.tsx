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
      <div className="space-y-6">
        <PageHeader
          eyebrow="TPO · Communication"
          title="Messages"
          description="Keep recruiter conversations tied to the right drive and follow up without leaving the placement workspace."
        />
        <ErrorState
          title="Invalid message filters"
          description="Check status, date range, search and pagination values. No communication data was loaded."
          action={
            <Link
              href="/tpo/messages"
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-[var(--lms-teal-deep)]"
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
  if(!isRecruiterInbox)return <div className="space-y-6">
   <PageHeader eyebrow="TPO · Communication" title="Messages"
    description="Keep recruiter conversations tied to the right drive and follow up without leaving the placement workspace."/>
   <ErrorState title="Recruiter conversations are temporarily unavailable"
    description="Your placement notifications remain available separately. No recruiter messages were loaded."
    action={<Link href="/tpo/notifications"
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] border border-border px-4 font-semibold text-[var(--lms-teal-deep)]">
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
    <div className="space-y-6">
      <TpoLiveRefresh intervalMs={4000}/>
      <PageHeader
        eyebrow="TPO · Communication"
        title="Messages"
        description="Keep recruiter conversations tied to the right drive and follow up without leaving the placement workspace."
        actions={
          <div className="flex flex-wrap gap-2">
            {isRecruiterInbox ? <TpoNewRecruiterConversation recruiters={availableRecruiters} actorUserId={context.user.id} /> : null}
            <Link
              href="/tpo/messages/notifications"
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] bg-primary px-4 text-sm font-[650] text-on-primary"
            >
              My placement notifications
            </Link>
            <Link
              href="/tpo/more"
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-[var(--lms-teal-deep)]"
            >
              More TPO tools
            </Link>
          </div>
        }
      />

      <section
        role="status"
        className="border-t border-border pt-5"
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-semibold text-foreground">
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
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
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
          <article
            key={metric.label}
            className="border-b border-border px-1 py-4"
          >
            <p className="text-xs font-semibold text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
              {metric.value}
            </p>
          </article>
        ))}
      </section>

      {isRecruiterInbox ? <nav aria-label="Recruiter inbox filters" className="flex flex-wrap gap-2">
        {([
          ["ALL","All",summary.total],
          ["REPLY","Reply",summary.reply],
          ["UNREAD","Unread",summary.unread],
        ] as const).map(([status,label,count])=><Link
          key={status}
          href={tpoMessagesHref({...commonFilters,status,page:1})}
          aria-current={query.status===status?"page":undefined}
          className={"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] border px-4 text-sm font-semibold "+
            (query.status===status?"border-primary bg-primary-subtle text-[var(--lms-teal-deep)]":
              "border-border bg-surface text-foreground")}>
            {label} ({count})
          </Link>)}
      </nav> : null}
      <section className="border-t border-border pt-4 sm:pt-5">
        <h2 className="text-base font-semibold text-foreground">
          Communication filters
        </h2>

        <form
          action="/tpo/messages"
          method="get"
          className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
        >
          <label className="grid gap-1 text-sm font-semibold text-body">
            Status
            <Select
              name="status"
              defaultValue={query.status}
              className="min-h-11 rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-sm text-foreground"
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

          <label className="grid gap-1 text-sm font-semibold text-body">
            From (IST)
            <Input
              type="date"
              name="from"
              defaultValue={query.from ?? ""}
              className="min-h-11 rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-sm text-foreground"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-body">
            To (IST)
            <Input
              type="date"
              name="to"
              defaultValue={query.to ?? ""}
              className="min-h-11 rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-sm text-foreground"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-body">
            Search
            {isRecruiterInbox?<TpoInboxSearch
              value={query.q} placeholder="Recruiter, subject or message"/>:
              <Input type="search" name="q" maxLength={120} defaultValue={query.q}
                placeholder="TPO name or event type"
                className="min-h-11 rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-sm text-foreground"/>}
          </label>

          <label className="grid gap-1 text-sm font-semibold text-body">
            Page size
            <Select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="min-h-11 rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-sm text-foreground"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Select>
          </label>

          <div className="flex flex-wrap gap-3 sm:col-span-2 xl:col-span-5">
            <Button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] bg-primary px-5 text-sm font-[650] text-on-primary hover:bg-primary-hover"
            >
              Apply filters
            </Button>

            <Link
              href="/tpo/messages"
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-[var(--lms-teal-deep)]"
            >
              Clear filters
            </Link>
          </div>
        </form>
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
                {item.waitingForYou?<span className="mr-2 rounded-[var(--lms-control-radius,9px)] border border-border px-2 py-1 text-xs">Waiting for you</span>:null}
                {item.accessEnded?<span className="rounded border border-border px-2 py-1 text-xs">Access ended</span>:null}
               </div>},
              {key:"subject",header:"Subject",mobileLabel:"Subject",mobilePriority:"action",
               cell:item=><div className="min-w-0">
                {isRecruiterInbox?<Link className="inline-flex min-h-11 items-center break-words font-semibold text-[var(--lms-teal-deep)] underline"
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
                className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline">Open related job →</Link>:
                <span className="text-muted-foreground">{isRecruiterInbox?"General conversation":"Recipient notification"}</span>},
            ]}
          />
        )}

        <nav
          aria-label="Messages pagination"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-body">
            Page {page} of {Math.max(1, totalPages)}
          </p>

          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={tpoMessagesHref({
                  ...commonFilters,
                  page: page - 1,
                })}
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-[var(--lms-teal-deep)]"
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
                className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-[var(--lms-teal-deep)]"
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
