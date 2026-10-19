"use client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import {useState} from "react";
import {filterLearnerProjectActivityText} from "@/modules/projects/learner-project-activity-text-model";
import { learnerProjectActivityPageSummary } from "@/modules/projects/learner-project-activity-page-summary-model";
import { learnerProjectActivityEmptyMessage } from "@/modules/projects/learner-project-activity-empty-model";
import { learnerProjectActivityLastFetched } from "@/modules/projects/learner-project-activity-cursor-model";
import Link from "next/link";
import { learnerProjectActivityCsv } from "@/modules/projects/learner-project-activity-csv-model";
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
  const [textQuery,setTextQuery]=useState("");
  const pageRows = parsed.success ? filterLearnerProjectActivity(events,category) : [];
  const shown=filterLearnerProjectActivityText(pageRows,textQuery);
  // Cursor advances using the last fetched row, never the last category/text match.
  const lastEvent=learnerProjectActivityLastFetched(events);
  const csv=learnerProjectActivityCsv(shown);
  const route = "/learn/projects/" + encodeURIComponent(projectId);
  return <section aria-label="Project Activity" className="space-y-4">
    <h2 className="text-lg font-semibold text-foreground">Activity</h2>
    <form method="get" action={route} className="grid gap-3 border-b border-border pb-5 sm:grid-cols-2 lg:grid-cols-5">
      <input type="hidden" name="tab" value="activity" />
      <label className="text-sm font-semibold text-foreground">Activity type
        <Select name="activityCategory" defaultValue={category}
          className="mt-2 min-h-9">
          {learnerProjectActivityCategories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </Select>
      </label>
      <label className="text-sm font-semibold text-foreground">From (IST)
        <Input type="date" name="activityFrom" defaultValue={parsed.success ? parsed.data.from : ""}
          className="mt-2 min-h-9" />
      </label>
      <label className="text-sm font-semibold text-foreground">Through (IST)
        <Input type="date" name="activityTo" defaultValue={parsed.success ? parsed.data.to : ""}
          className="mt-2 min-h-9" />
      </label>
      <Button type="submit" className="min-h-9 self-end">Apply</Button>
      <Link href={route + "?tab=activity"} className="inline-flex min-h-9 sm:min-h-9 items-center justify-center self-end rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">Clear</Link>
    </form>
    {parsed.success && pageRows.length > 0 ? (
      <div className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
        <label className="min-w-0 flex-1 text-sm font-semibold text-foreground">Find in this activity page
          <Input type="search" maxLength={100} value={textQuery}
            onChange={event=>setTextQuery(event.target.value)}
            placeholder="Search summary, subject or actor"
            className="mt-1.5 min-h-9" />
        </label>
        {textQuery ? <Button type="button" onClick={()=>setTextQuery("")}
          variant="secondary" className="min-h-9">Clear text search</Button> : null}
      </div>
    ) : null}
    {!parsed.success ? <p role="alert" className="rounded-lg border border-warning-border bg-warning-subtle p-3 text-sm text-body">Choose valid dates with the start on or before the end, and a listed activity type. If this page link is invalid, use Clear to return to recent activity.</p> : null}
    {parsed.success ? <p role="status" aria-live="polite" className="text-xs font-semibold text-muted-foreground">{learnerProjectActivityPageSummary(shown.length,pageRows.length,Boolean(textQuery.trim()))}</p> : null}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p role="status" className="text-sm text-muted-foreground">{shown.length} matching events shown</p>
      {parsed.success && shown.length ? (
        <a href={"data:text/csv;charset=utf-8,"+encodeURIComponent(csv.content)} download="learner-project-activity.csv"
          className="inline-flex min-h-9 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text">
          Download shown events CSV
        </a>
      ) : null}
    </div>
    {shown.length === 0 ? <div className="border-b border-border py-4 text-sm text-muted-foreground">
      {learnerProjectActivityEmptyMessage({
        valid:parsed.success,
        fetchedCount:events.length,
        pageCount:pageRows.length,
        searching:Boolean(textQuery.trim()),
        filtered:category!=="ALL" || (parsed.success && Boolean(parsed.data.from || parsed.data.to)),
        olderPage:parsed.success && Boolean(parsed.data.beforeTime),
        hasMore,
      })}
    </div> : <ol className="divide-y divide-border border-y border-border">{shown.map(event => <li key={event.id}
      className="min-w-0 py-4">
      <p className="break-words text-sm font-semibold text-foreground">{event.summary}</p>
      {event.subjectLabel ? <p className="mt-1 break-words text-sm text-body">{event.subjectLabel}</p> : null}
      <p className="mt-2 break-words text-xs text-muted-foreground">{event.actorDisplayName ?? "System"} · <time dateTime={event.occurredAt.toISOString()}>{formatter.format(event.occurredAt)} IST</time></p>
    </li>)}</ol>}
    {parsed.success ? <nav aria-label="Activity pages" className="flex flex-wrap gap-3">
      {parsed.data.beforeTime ? <Link href={learnerProjectActivityPageHref(projectId, parsed.data)}
        className="inline-flex min-h-9 sm:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">Newest activity page</Link> : null}
      {hasMore && lastEvent ? <Link href={learnerProjectActivityPageHref(projectId, parsed.data, { time: lastEvent.cursorOccurredAt, id: lastEvent.id })}
        className="inline-flex min-h-9 sm:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">Older activity page →</Link> : null}
    </nav> : null}
    <p className="text-xs leading-5 text-muted-foreground">Category and IST dates are applied to authorized Project history. Text search only filters the current page of up to 100 fetched events; Older activity pages use the original page cursor to avoid skipping history. CSV downloads include only the currently displayed matches.</p>
  </section>;
}
