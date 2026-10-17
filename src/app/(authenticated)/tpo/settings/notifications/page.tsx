import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import {TpoMyNotificationPreferencesEditor} from "@/components/tpo/tpo-my-notification-preferences-editor";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

import { hasMembershipRole } from "@/modules/identity/context";
import {
  TPO_NOTIFICATION_VIEWS,
  tpoMyNotificationsHref,
  tpoMyNotificationsQuerySchema,
} from "@/modules/placements/tpo-my-notifications-model";
import {
  getTpoMyNotifications,
} from "@/modules/placements/tpo-my-notifications-service";

type SearchParams = {
  view?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
};

function first(
  value: string | string[] | undefined,
) {
  return Array.isArray(value) ? value[0] : value;
}

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

  const parsed = tpoMyNotificationsQuerySchema.safeParse({
    view: first(raw.view) || undefined,
    page: first(raw.page) || undefined,
    pageSize: first(raw.pageSize) || undefined,
  });

  if (!parsed.success) {
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
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
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
    parsed.data,
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
            className="rounded-xl border border-border bg-surface p-5"
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

      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
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
            <select
              name="view"
              defaultValue={query.view}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
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
            </select>
          </label>

          <label className="grid min-w-28 gap-1 text-sm font-semibold text-body">
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

          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
          >
            Apply
          </button>

          <Link
            href="/tpo/settings/notifications"
            className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
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
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Subject
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Module
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Read status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Received
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-border"
                  >
                    <td className="px-4 py-4">
                      <p className="font-semibold text-foreground">
                        {item.subject}
                      </p>
                      {item.importance === "HIGH" ||
                      item.importance === "CRITICAL" ? (
                        <div className="mt-2">
                          <StatusBadge
                            tone={
                              item.importance === "CRITICAL"
                                ? "error"
                                : "warning"
                            }
                          >
                            {item.importance === "CRITICAL"
                              ? "Critical"
                              : "High importance"}
                          </StatusBadge>
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-4 text-body">
                      {item.module}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge
                        tone={
                          item.status === "UNREAD"
                            ? "info"
                            : "neutral"
                        }
                      >
                        {item.status === "UNREAD"
                          ? "Unread"
                          : "Read"}
                      </StatusBadge>
                    </td>

                    <td className="px-4 py-4 text-body">
                      <time dateTime={item.createdAt.toISOString()}>
                        {formatWhen(item.createdAt)} IST
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
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
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
              >
                Next
              </Link>
            ) : null}
          </div>
        </nav>
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
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
            className="p-5 text-sm leading-6 text-body"
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
                className="border-b border-border px-5 py-4 text-sm leading-6 text-body"
              >
                No saved preference row exists for your user
                account in this college. The values below
                are the declared database source defaults,
                not persisted personal selections.
              </p>
            ) : null}

            <TpoMyNotificationPreferencesEditor
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
