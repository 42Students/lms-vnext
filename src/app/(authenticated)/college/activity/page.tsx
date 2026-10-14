import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { activitySearchParams, collegeActivityHref, collegeActivityQuerySchema } from "@/modules/activity/college-activity-model";
import { listCollegeActivity } from "@/modules/activity/college-activity-service";
import { ACTIVITY_IMPORTANCE, ACTIVITY_MODULES } from "@/modules/activity/taxonomy";

type RawSearch = Record<string, string | string[] | undefined>;

function when(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
  }).format(value);
}

export default async function CollegeActivityPage({
  searchParams,
}: { searchParams: Promise<RawSearch> }) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const parsed = collegeActivityQuerySchema.safeParse(
    activitySearchParams(await searchParams),
  );
  if (!parsed.success) return <div className="space-y-4">
    <PageHeader eyebrow="College Admin" title="Activity Log" />
    <ErrorState title="Invalid activity filters"
      description="The actor, entity, date range or pagination cursor is invalid. No audit events were loaded."
      action={<Link href="/college/activity" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;
  const data = await listCollegeActivity(context, parsed.data);
  const exportParams = new URLSearchParams();
  for (const key of ["module", "importance", "eventType", "q", "actorUserId", "actorName", "subjectType", "subjectId", "from", "to"] as const) {
    const value = data.query[key];
    if (value) exportParams.set(key, value);
  }
  return <div className="space-y-6">
    <PageHeader eyebrow="College Admin · Operations" title="Activity Log"
      description="College-scoped immutable event history, with severity, module, action, actor, entity and date filters. Newest events first."
      actions={<a href={"/api/activity/college-export" +
        (exportParams.size ? "?" + exportParams.toString() : "")}
        className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
        Export filtered CSV (max 1,000)
      </a>} />
    <p className="text-xs text-muted-foreground">
      The export uses severity, module, action, actor, entity type, entity identifier and IST date filters from the newest event,
      with a 1,000-row cap and an explicit CSV footer if truncated.
    </p>
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-5" aria-label="Activity log filters">
      <form action="/college/activity" method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1 text-sm font-semibold text-body">
          Module
          <select name="module" defaultValue={data.query.module ?? ""}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="">All modules</option>
            {ACTIVITY_MODULES.map(v =>
              <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Importance
          <select name="importance" defaultValue={data.query.importance ?? ""}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="">All importance levels</option>
            {ACTIVITY_IMPORTANCE.map(v =>
              <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Event type
          <input name="eventType" defaultValue={data.query.eventType ?? ""}
            maxLength={120} placeholder="identity.membership.suspended"
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Search audit summary or entity
          <input name="q" defaultValue={data.query.q ?? ""} maxLength={100}
            placeholder="Summary, entity or action text"
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Actor user UUID
          <input name="actorUserId" defaultValue={data.query.actorUserId ?? ""}
            placeholder="Optional actor UUID"
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Actor display name
          <input name="actorName" defaultValue={data.query.actorName ?? ""} maxLength={100}
            placeholder="Search recorded actor name"
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Entity type
          <input name="subjectType" defaultValue={data.query.subjectType ?? ""}
            maxLength={80} placeholder="course_lesson"
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          Entity identifier
          <input name="subjectId" defaultValue={data.query.subjectId ?? ""}
            maxLength={500} placeholder="Persisted entity identifier"
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          From date (IST)
          <input name="from" type="date" defaultValue={data.query.from ?? ""}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">
          To date (IST)
          <input name="to" type="date" defaultValue={data.query.to ?? ""}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
        </label>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary">
            Apply filters
          </button>
          <Link href="/college/activity" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Clear
          </Link>
        </div>
      </form>
    </section>
    <section className="overflow-x-auto rounded-xl border border-border bg-surface" aria-label="College activity events">
      {data.items.length === 0 ? (
        <p className="p-6 text-sm text-body">
          No persisted activity events match these filters. This is not a statement that no changes have ever occurred.
        </p>
      ) : <table className="w-full min-w-[47rem] text-left text-sm">
        <thead className="bg-muted text-muted-foreground"><tr>
          <th scope="col" className="px-4 py-3">Occurred (IST)</th>
          <th scope="col" className="px-4 py-3">Actor</th>
          <th scope="col" className="px-4 py-3">Event / entity</th>
          <th scope="col" className="px-4 py-3">Details</th>
        </tr></thead>
        <tbody>{data.items.map(({event,actor})=>(
          <tr key={event.id} className="border-t border-border align-top">
            <td className="px-4 py-4 text-body">{when(event.occurredAt)}</td>
            <td className="px-4 py-4 text-body">
              <span className="font-semibold text-foreground">{actor?.displayName ?? actor?.email ?? "System"}</span>
              {actor?.id ? <p className="mt-1 break-all text-xs text-muted-foreground">{actor.id}</p> : null}
            </td>
            <td className="px-4 py-4">
              <p className="font-semibold text-foreground">{event.summary}</p>
              <p className="mt-1 text-xs text-muted-foreground">{event.eventType} · {event.subjectType}</p>
              <p className="mt-1 text-xs text-muted-foreground">{event.subjectLabel ?? "No entity label recorded"}</p>
            </td>
            <td className="px-4 py-4">
              <Link href={"/college/activity/" + encodeURIComponent(event.id)}
                className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
                View event
              </Link>
            </td>
          </tr>
        ))}</tbody>
      </table>}
    </section>
    <nav aria-label="Activity history pagination" className="flex items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">Up to 25 events per page</p>
      {data.nextCursor ? <Link href={collegeActivityHref(data.query, data.nextCursor)}
        className="inline-flex min-h-10 items-center rounded-md border border-border px-4 font-semibold text-primary-text">
        Older activity
      </Link> : <span className="text-muted-foreground">No older matching events</span>}
    </nav>
    <p className="text-xs text-muted-foreground">
      Audit results are immutable persisted events. Detail metadata is sanitized before display.
      Search filters are scoped to the signed-in College Admin; this page has no write actions.
    </p>
  </div>;
}
