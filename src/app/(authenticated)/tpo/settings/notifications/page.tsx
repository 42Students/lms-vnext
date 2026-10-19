import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import {TpoMyNotificationPreferencesEditor} from "@/components/tpo/tpo-my-notification-preferences-editor";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { hasMembershipRole } from "@/modules/identity/context";
import {
  TPO_NOTIFICATION_VIEWS,
  tpoMyNotificationsHref,
  parseTpoMyNotificationsParams,
} from "@/modules/placements/tpo-my-notifications-model";
import {
  getTpoMyNotifications,
} from "@/modules/placements/tpo-my-notifications-service";

type SearchParams = {
  view?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
};

function formatWhen(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

export default async function TpoMyNotificationsPage({
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

  const raw = await searchParams;

  const parsed=parseTpoMyNotificationsParams(raw);

  if (!parsed) {
    return (
      <div className="space-y-6">
        <TpoSettingsNav active="notifications" />

        <PageHeader
          eyebrow="TPO · Settings"
          title="My Notifications"
          description="Your own college-scoped notification deliveries and saved notification preferences."
        />

        <ErrorState
          title="Invalid notification filters"
          description="Check the selected read status, page and page size. No notification data was loaded."
          action={
            <Link
              href="/tpo/settings/notifications"
              className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-link"
            >
              Clear filters
            </Link>
          }
        />
      </div>
    );
  }

  const data = await getTpoMyNotifications(
    context,
    parsed,
  );

  const {
    query,
    summary,
    items,
    preferences,
    page,
    pageSize,
    matchedTotal,
    totalPages,
  } = data;

  const firstItem =
    matchedTotal === 0
      ? 0
      : (page - 1) * pageSize + 1;

  const lastItem = Math.min(
    matchedTotal,
    page * pageSize,
  );

  return (
    <div className="space-y-6">
      <TpoSettingsNav active="notifications" />

      <PageHeader
        eyebrow="TPO · Settings"
        title="My Notifications"
        description="Only in-app notifications addressed to your signed-in account and recorded against your current college. Read-only; no notification is marked read by visiting this page."
      />

      <section
        aria-label="My notification summary"
        className="grid gap-3 sm:grid-cols-3"
      >
        {[
          {
            label: "My college notifications",
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

      <section className="border-t border-border pt-4">
        <h2 className="text-lg font-semibold text-foreground">
          My notification history
        </h2>

        <p className="mt-1 text-sm leading-6 text-body">
          Subjects use fixed module labels rather than stored
          notification titles or bodies, which may contain
          personal information. No other person&apos;s
          notifications are included.
        </p>

        <form
          action="/tpo/settings/notifications"
          method="get"
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Read status
            <Select
              name="view"
              defaultValue={query.view}
              className="min-h-11 sm:min-h-9"
            >
              {TPO_NOTIFICATION_VIEWS.map((view) => (
                <option key={view} value={view}>
                  {view === "ALL"
                    ? "All notifications"
                    : view === "UNREAD"
                      ? "Unread"
                      : "Read"}
                </option>
              ))}
            </Select>
          </label>

          <label className="grid min-w-28 gap-1 text-sm font-semibold text-body">
            Page size
            <Select
              name="pageSize"
              defaultValue={String(pageSize)}
              className="min-h-11 sm:min-h-9"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Select>
          </label>

          <Button
            type="submit"
            className="min-h-11 sm:min-h-9"
          >
            Apply
          </Button>

          <Link
            href="/tpo/settings/notifications"
            className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-link"
          >
            Clear filters
          </Link>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Notification records
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {matchedTotal === 0
                ? "No matching notifications"
                : firstItem > matchedTotal
                  ? `Page ${page} is beyond the available results`
                  : `Showing ${firstItem}–${lastItem} of ${matchedTotal}`}
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Newest first · IST
          </p>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title={
              matchedTotal === 0
                ? "No matching notifications"
                : "No notifications on this page"
            }
            description={
              matchedTotal === 0
                ? "No in-app notification deliveries to your account match this read-status filter within your current college."
                : "Try a previous page or clear the filter."
            }
          />
        ) : (
          <DataTable
            rows={items}
            getRowKey={item=>item.id}
            caption="My notifications"
            empty={<p>No in-app notification deliveries to your account match this read-status filter within your current college.</p>}
            columns={[
              {key:"subject",header:"Subject",mobilePriority:"primary",cell:item=>
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">{item.subject}</p>
                  {item.importance==="HIGH"||item.importance==="CRITICAL"?
                    <StatusBadge tone={item.importance==="CRITICAL"?"error":"warning"}>
                      {item.importance==="CRITICAL"?"Critical":"High importance"}
                    </StatusBadge>:null}
                </div>},
              {key:"module",header:"Module",mobilePriority:"secondary",cell:item=>item.module},
              {key:"status",header:"Read status",mobilePriority:"secondary",cell:item=>
                <StatusBadge tone={item.status==="UNREAD"?"info":"neutral"}>
                  {item.status==="UNREAD"?"Unread":"Read"}
                </StatusBadge>},
              {key:"received",header:"Received",mobilePriority:"secondary",cell:item=>
                <time dateTime={item.createdAt.toISOString()}>{formatWhen(item.createdAt)} IST</time>},
            ]}
          />
        )}

        <nav
          aria-label="My notifications pagination"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-sm text-body">
            Page {page} of {Math.max(1, totalPages)}
          </p>

          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={tpoMyNotificationsHref({
                  view: query.view,
                  pageSize,
                  page: page - 1,
                })}
                className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-link"
              >
                Previous
              </Link>
            ) : null}

            {page < totalPages ? (
              <Link
                href={tpoMyNotificationsHref({
                  view: query.view,
                  pageSize,
                  page: page + 1,
                })}
                className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-link"
              >
                Next
              </Link>
            ) : null}
          </div>
        </nav>
      </section>

      <section className="border-t border-border">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              My notification preferences
            </h2>
            <p className="mt-1 text-sm leading-6 text-body">
              These settings are displayed for your own user
              account and current college only.
            </p>
          </div>

          <StatusBadge
            tone={
              preferences.source === "PERSISTED"
                ? "success"
                : preferences.source === "SOURCE_DEFAULT"
                  ? "info"
                  : "warning"
            }
          >
            {preferences.source === "PERSISTED"
              ? "Persisted"
              : preferences.source === "SOURCE_DEFAULT"
                ? "Source default"
                : "Unavailable"}
          </StatusBadge>
        </div>

        {preferences.source === "UNAVAILABLE" ? (
          <div
            role="status"
            className="py-4 text-sm leading-6 text-body"
          >
            The TPO notification-preference table is not
            registered in the current database. Saved
            preferences cannot be read. No preference value
            is asserted from this missing source.
          </div>
        ) : (
          <>
            {preferences.source === "SOURCE_DEFAULT" ? (
              <p
                role="status"
                className="border-b border-border py-4 text-sm leading-6 text-body"
              >
                No saved preference row exists for your user
                account in this college. The values below
                are the declared database source defaults,
                not persisted personal selections.
              </p>
            ) : null}

            <TpoMyNotificationPreferencesEditor key={context.user.id+":"+data.collegeId}
             initial={preferences.values} version={data.preferencesVersion}/>

          </>
        )}
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        Source: in_app_notifications joined to college-scoped
        activity_events, filtered to the authenticated recipient.
        Saved preferences are read from
        placement_tpo_user_preferences only when that table
        exists. No bodies, raw notification titles, activity
        metadata or recipient contact information are exposed here.
        Preference saves are audited; read acknowledgments are separate.
        Preference values do not prove that downstream
        delivery behavior has been implemented.
      </p>
    </div>
  );
}
