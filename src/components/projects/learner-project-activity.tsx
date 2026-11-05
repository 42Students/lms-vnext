"use client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";

import {useState} from "react";
import {filterLearnerProjectActivityText} from "@/modules/projects/learner-project-activity-text-model";
import { learnerProjectActivityPageSummary } from "@/modules/projects/learner-project-activity-page-summary-model";
import { learnerProjectActivityEmptyMessage } from "@/modules/projects/learner-project-activity-empty-model";
import { learnerProjectActivityLastFetched } from "@/modules/projects/learner-project-activity-cursor-model";
import { learnerProjectActivityCsv } from "@/modules/projects/learner-project-activity-csv-model";
import { filterLearnerProjectActivity, learnerProjectActivityCategories,
  learnerProjectActivityPageHref, parseLearnerProjectActivityFilters, learnerProjectActivityCategorySchema } from "@/modules/projects/learner-project-activity-filter-model";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
import { istDateTimeFormatter } from "@/lib/format-date";

type ActivityRow = {
  id: string; eventType: string; summary: string; occurredAt: Date;
  actorDisplayName: string | null; subjectLabel: string | null; cursorOccurredAt: string;
};
const formatter = istDateTimeFormatter;
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
  return <section aria-labelledby="learner-project-activity-heading" className="space-y-4">
    <Heading level={2} size="base" id="learner-project-activity-heading" className="leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px] text-[var(--lms-heading)]">Activity</Heading>
    <Disclosure title="Filter activity by type and dates" defaultOpen={Boolean(parsed.success &&
      (category !== "ALL" || parsed.data.from || parsed.data.to))}>
    <form method="get" action={route} className="grid min-w-0 grid-cols-1 gap-3 pb-5 pt-3 md:grid-cols-2 lg:grid-cols-5">
      <input type="hidden" name="tab" value="activity" />
      <Label>Activity type
        <Select name="activityCategory" defaultValue={category}
          className="mt-[6px] min-h-11 w-full border border-border px-3 text-[length:var(--lms-font-base)] font-normal md:min-h-9">
          {learnerProjectActivityCategories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </Select>
      </Label>
      <Label>From (IST)
        <Input type="date" name="activityFrom" defaultValue={parsed.success ? parsed.data.from : ""}
          className="mt-[6px] min-h-11 w-full border border-border px-3 text-[length:var(--lms-font-base)] font-normal md:min-h-9" />
      </Label>
      <Label>Through (IST)
        <Input type="date" name="activityTo" defaultValue={parsed.success ? parsed.data.to : ""}
          className="mt-[6px] min-h-11 w-full border border-border px-3 text-[length:var(--lms-font-base)] font-normal md:min-h-9" />
      </Label>
      <Button type="submit" className="min-h-11 self-end md:min-h-9">Apply</Button>
      <ButtonLink variant="secondary" data-unskin="" href={route + "?tab=activity"} className="self-end">Clear</ButtonLink>
    </form>
    </Disclosure>
    {parsed.success && pageRows.length > 0 ? (
      <div className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
        <Label className="min-w-0 flex-1">Find in this activity page
          <Input type="search" maxLength={100} value={textQuery}
            onChange={event=>setTextQuery(event.target.value)}
            placeholder="Search summary, subject or actor"
            className="mt-1.5 min-h-11 md:min-h-9" />
        </Label>
        {textQuery ? <Button type="button" onClick={()=>setTextQuery("")}
          variant="secondary" className="min-h-11 md:min-h-9">Clear text search</Button> : null}
      </div>
    ) : null}
    {!parsed.success ? <Banner tone="warning" role="alert">Choose valid dates with the start on or before the end, and a listed activity type. If this page link is invalid, use Clear to return to recent activity.</Banner> : null}
    {parsed.success ? <p role="status" aria-live="polite" className="text-xs font-semibold text-muted-foreground leading-[20px]">{learnerProjectActivityPageSummary(shown.length,pageRows.length,Boolean(textQuery.trim()))}</p> : null}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p role="status" className="text-sm text-muted-foreground leading-[22px]">{shown.length} matching events shown</p>
      {parsed.success && shown.length ? (
        <ButtonLink variant="secondary" data-unskin="" href={"data:text/csv;charset=utf-8,"+encodeURIComponent(csv.content)} download="learner-project-activity.csv">
          Download shown events CSV
        </ButtonLink>
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
      className="min-w-0 py-[var(--lms-space-3)]">
      <p className="break-words text-sm font-semibold text-foreground leading-[22px]">{event.summary}</p>
      {event.subjectLabel ? <p className="mt-1 break-words text-sm text-body leading-[22px]">{event.subjectLabel}</p> : null}
      <p className="mt-2 break-words text-xs text-muted-foreground leading-[20px]">{event.actorDisplayName ?? "System"} · <time dateTime={event.occurredAt.toISOString()}>{formatter.format(event.occurredAt)} IST</time></p>
    </li>)}</ol>}
    {parsed.success ? <nav aria-label="Activity pages" className="flex flex-wrap gap-3">
      {parsed.data.beforeTime ? <ButtonLink variant="secondary" data-unskin="" href={learnerProjectActivityPageHref(projectId, parsed.data)}>Newest activity page</ButtonLink> : null}
      {hasMore && lastEvent ? <ButtonLink variant="secondary" data-unskin="" href={learnerProjectActivityPageHref(projectId, parsed.data, { time: lastEvent.cursorOccurredAt, id: lastEvent.id })}>Older activity page →</ButtonLink> : null}
    </nav> : null}
    <p className="text-xs text-muted-foreground leading-[20px]">Category and IST dates are applied to authorized Project history. Text search only filters the current page of up to 100 fetched events; Older activity pages use the original page cursor to avoid skipping history. CSV downloads include only the currently displayed matches.</p>
  </section>;
}
