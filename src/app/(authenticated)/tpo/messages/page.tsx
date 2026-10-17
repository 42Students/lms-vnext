import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { formatTpoInboxTime } from "@/modules/placements/tpo-inbox-date-model";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { TpoNewRecruiterConversation } from "@/components/tpo/tpo-new-recruiter-conversation";
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
          description="Read-only college-scoped communication records."
        />
        <ErrorState
          title="Invalid message filters"
          description="Check status, date range, search and pagination values. No communication data was loaded."
          action={
            <Link
              href="/tpo/messages"
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
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
      <PageHeader
        eyebrow="TPO · Communication"
        title="Messages"
        description="Recruiter conversations and placement notifications for your college. Times are displayed in IST."
        actions={
          <div className="flex flex-wrap gap-2">
            {isRecruiterInbox ? <TpoNewRecruiterConversation recruiters={availableRecruiters} actorUserId={context.user.id} /> : null}
            <Link
              href="/tpo/messages/notifications"
              className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary"
            >
              My placement notifications
            </Link>
            <Link
              href="/tpo/more"
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
            >
              More TPO tools
            </Link>
          </div>
        }
      />

      <section
        role="status"
        className="rounded-xl border border-border bg-surface p-5"
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-semibold text-foreground">
            Current source: {sourceLabel}
          </h2>
          <StatusBadge
            tone={
              isRecruiterInbox
                ? "info"
                : "warning"
            }
          >
            {isRecruiterInbox
              ? "Conversation tables available"
              : "Notification fallback"}
          </StatusBadge>
        </div>

        {isRecruiterInbox ? (
          <p className="mt-2 text-sm leading-6 text-body">
            Recruiter conversation threads are persisted in
            the current database. This overview shows authorized college recruiter threads.
            Open a conversation to read its messages and reply.
          </p>
        ) : (
          <p className="mt-2 text-sm leading-6 text-body">
            Recruiter Messages tables are not fully registered
            in this database. The list below therefore shows
            actual in-app placement notifications delivered
            to active TPO members of this college. These are
            <strong> not recruiter conversations</strong>,
            and their read/unread status belongs to the
            notification recipient. Missing conversations
            must not be interpreted as zero messages.
          </p>
        )}

        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          The outbound email/SMS messaging schema is draft-only.
          No delivery, bounce, sent-message or inbox counts
          are inferred from it. Notification bodies and private contact details are not exposed in this overview.
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
            className="rounded-xl border border-border bg-surface p-4"
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
          className={"inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-semibold "+
            (query.status===status?"border-primary bg-primary-subtle text-primary-text":
              "border-border bg-surface text-foreground")}>
            {label} ({count})
          </Link>)}
      </nav> : null}
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
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
            <select
              name="status"
              defaultValue={query.status}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
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
            </select>
          </label>

          <label className="grid gap-1 text-sm font-semibold text-body">
            From (IST)
            <input
              type="date"
              name="from"
              defaultValue={query.from ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-body">
            To (IST)
            <input
              type="date"
              name="to"
              defaultValue={query.to ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-body">
            Search
            <input
              type="search"
              name="q"
              maxLength={120}
              defaultValue={query.q}
              placeholder={
                isRecruiterInbox
                  ? "Recruiter, subject or message"
                  : "TPO name or event type"
              }
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-body">
            Page size
            <select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-3 sm:col-span-2 xl:col-span-5">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
            >
              Apply filters
            </button>

            <Link
              href="/tpo/messages"
              className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
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
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[50rem] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    {isRecruiterInbox
                      ? "Recruiter"
                      : "TPO recipient"}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Subject
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {isRecruiterInbox
                      ? "Message records"
                      : "Record type"}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Last activity
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Context
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-border align-top"
                  >
                    <td className="px-4 py-4 font-semibold text-foreground">
                      {item.participantName}
                      {item.companyName ? <p className="mt-1 text-xs font-normal text-muted-foreground">{item.companyName}</p> : null}
                       {item.waitingForYou?<span className="ml-2 rounded border border-border px-2 py-0.5 text-xs">Waiting for you</span>:null}
                       {item.accessEnded?<span className="ml-2 rounded border border-border px-2 py-0.5 text-xs">Access ended</span>:null}
                    </td>

                    <td className="px-4 py-4 text-body">
                      {isRecruiterInbox ? <Link className="font-semibold text-primary-text hover:underline"
                        href={"/tpo/messages/" + encodeURIComponent(item.id)}>{item.subject} →</Link> : item.subject}
                       {item.lastPreview?<p className="mt-1 max-w-sm truncate text-xs text-muted-foreground">{item.lastPreview}</p>:null}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge
                        tone={
                          item.status === "UNREAD"
                            ? "info"
                            : "neutral"
                        }
                      >
                        {labelStatus(item.status)}
                      </StatusBadge>
                    </td>

                    <td className="px-4 py-4 text-body">
                      {isRecruiterInbox ? (
                        <>
                          <span className="font-semibold tabular-nums">
                            {item.messageCount ?? 0}
                          </span>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.unreadCount ?? 0} unread recruiter
                            {" "}message records
                          </p>
                        </>
                      ) : (
                        "In-app notification"
                      )}
                    </td>

                    <td className="px-4 py-4 text-body">
                      <time dateTime={item.occurredAt.toISOString()}>
                        {formatTpoInboxTime(item.occurredAt, now)}
                      </time>
                    </td>

                    <td className="px-4 py-4">
                      {item.jobId ? (
                        <Link
                          href={`/tpo/placements/jobs/${encodeURIComponent(
                            item.jobId,
                          )}`}
                          className="font-semibold text-primary-text hover:underline"
                        >
                          Open related job →
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          {isRecruiterInbox
                            ? "General conversation"
                            : "Recipient notification"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
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
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
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
