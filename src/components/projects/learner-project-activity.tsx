import Link from "next/link";
import { filterLearnerProjectActivity, learnerProjectActivityCategories,
  learnerProjectActivityCategorySchema } from "@/modules/projects/learner-project-activity-filter-model";

type ActivityRow = {
  id: string; eventType: string; summary: string; occurredAt: Date;
  actorDisplayName: string | null; subjectLabel: string | null;
};
const formatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
});
export function LearnerProjectActivity({ projectId, events, categoryInput }: {
  projectId: string; events: readonly ActivityRow[]; categoryInput: unknown;
}) {
  const category = learnerProjectActivityCategorySchema.safeParse(categoryInput).data ?? "ALL";
  const shown = filterLearnerProjectActivity(events, category);
  const route = "/learn/projects/" + encodeURIComponent(projectId);
  return <section aria-label="Project Activity" className="space-y-4">
    <h2 className="text-lg font-semibold text-foreground">Activity</h2>
    <form method="get" action={route} className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3">
      <input type="hidden" name="tab" value="activity" />
      <label className="text-sm font-semibold text-foreground">Activity type
        <select name="activityCategory" defaultValue={category}
          className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-normal">
          {learnerProjectActivityCategories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <button type="submit" className="min-h-11 self-end rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Apply</button>
      <Link href={route + "?tab=activity"} className="inline-flex min-h-11 items-center justify-center self-end rounded-lg border border-border px-4 text-sm font-semibold text-primary-text">Clear</Link>
    </form>
    <p role="status" className="text-sm text-muted-foreground">{shown.length} of {events.length} loaded events match</p>
    {shown.length === 0 ? <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
      {events.length === 0 ? "No persisted Project activity yet." : "No activity matches this filter. Clear it to see all loaded events."}
    </div> : <ol className="space-y-3">{shown.map(event => <li key={event.id}
      className="min-w-0 rounded-xl border border-border bg-surface p-4">
      <p className="break-words text-sm font-semibold text-foreground">{event.summary}</p>
      {event.subjectLabel ? <p className="mt-1 break-words text-sm text-body">{event.subjectLabel}</p> : null}
      <p className="mt-2 break-words text-xs text-muted-foreground">{event.actorDisplayName ?? "System"} · <time dateTime={event.occurredAt.toISOString()}>{formatter.format(event.occurredAt)} IST</time></p>
    </li>)}</ol>}
    <p className="text-xs leading-5 text-muted-foreground">Filters cover the latest 100 persisted Project events returned by the authorized feed. They do not represent a complete historical archive.</p>
  </section>;
}
