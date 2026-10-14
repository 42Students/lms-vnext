import Link from "next/link";
import { filterLearnerProjectActivity, learnerProjectActivityCategories,
  learnerProjectActivityPageHref, parseLearnerProjectActivityFilters, learnerProjectActivityCategorySchema } from "@/modules/projects/learner-project-activity-filter-model";

type ActivityRow = {
  id: string; eventType: string; summary: string; occurredAt: Date;
  actorDisplayName: string | null; subjectLabel: string | null; cursorOccurredAt: string;
};
const formatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
});
export function LearnerProjectActivity({ projectId, events, categoryInput, fromInput, toInput, beforeTimeInput, beforeIdInput, hasMore }: {
  projectId: string; events: readonly ActivityRow[]; categoryInput: unknown; fromInput?: unknown; toInput?: unknown; beforeTimeInput?: unknown; beforeIdInput?: unknown; hasMore: boolean;
}) {
  const category = learnerProjectActivityCategorySchema.safeParse(categoryInput).data ?? "ALL";
  const parsed = parseLearnerProjectActivityFilters({ category: categoryInput, from: fromInput, to: toInput,
    beforeTime: beforeTimeInput, beforeId: beforeIdInput });
  const shown = parsed.success ? filterLearnerProjectActivity(events, category) : [];
  const lastEvent = shown.at(-1);
  const route = "/learn/projects/" + encodeURIComponent(projectId);
  return <section aria-label="Project Activity" className="space-y-4">
    <h2 className="text-lg font-semibold text-foreground">Activity</h2>
    <form method="get" action={route} className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
      <input type="hidden" name="tab" value="activity" />
      <label className="text-sm font-semibold text-foreground">Activity type
        <select name="activityCategory" defaultValue={category}
          className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-normal">
          {learnerProjectActivityCategories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold text-foreground">From (IST)
        <input type="date" name="activityFrom" defaultValue={parsed.success ? parsed.data.from : ""}
          className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-normal" />
      </label>
      <label className="text-sm font-semibold text-foreground">Through (IST)
        <input type="date" name="activityTo" defaultValue={parsed.success ? parsed.data.to : ""}
          className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-normal" />
      </label>
      <button type="submit" className="min-h-11 self-end rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Apply</button>
      <Link href={route + "?tab=activity"} className="inline-flex min-h-11 items-center justify-center self-end rounded-lg border border-border px-4 text-sm font-semibold text-primary-text">Clear</Link>
    </form>
    {!parsed.success ? <p role="alert" className="rounded-lg border border-warning-border bg-warning-subtle p-3 text-sm text-body">Choose valid dates with the start on or before the end, and a listed activity type. If this page link is invalid, use Clear to return to recent activity.</p> : null}
    <p role="status" className="text-sm text-muted-foreground">{shown.length} matching events shown</p>
    {shown.length === 0 ? <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
      {!parsed.success ? "Apply a valid filter to view activity." : category === "ALL" && !parsed.data.from && !parsed.data.to ? "No persisted Project activity yet." : "No activity matches these filters. Clear them to see recent activity."}
    </div> : <ol className="space-y-3">{shown.map(event => <li key={event.id}
      className="min-w-0 rounded-xl border border-border bg-surface p-4">
      <p className="break-words text-sm font-semibold text-foreground">{event.summary}</p>
      {event.subjectLabel ? <p className="mt-1 break-words text-sm text-body">{event.subjectLabel}</p> : null}
      <p className="mt-2 break-words text-xs text-muted-foreground">{event.actorDisplayName ?? "System"} · <time dateTime={event.occurredAt.toISOString()}>{formatter.format(event.occurredAt)} IST</time></p>
    </li>)}</ol>}
    {parsed.success ? <nav aria-label="Activity pages" className="flex flex-wrap gap-3">
      {parsed.data.beforeTime ? <Link href={learnerProjectActivityPageHref(projectId, parsed.data)}
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-primary-text">Newest matching events</Link> : null}
      {hasMore && lastEvent ? <Link href={learnerProjectActivityPageHref(projectId, parsed.data, { time: lastEvent.cursorOccurredAt, id: lastEvent.id })}
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-primary-text">Older matching events →</Link> : null}
    </nav> : null}
    <p className="text-xs leading-5 text-muted-foreground">Category and IST dates are applied to the authorized Project history. Each page shows up to 100 matching events; use Older matching events to continue. Unrecorded historical actions cannot appear here.</p>
  </section>;
}
