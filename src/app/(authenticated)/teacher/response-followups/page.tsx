import { Pagination } from "@/components/ui/pagination";
import { Disclosure } from "@/components/ui/disclosure";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  facultyResponseFollowUpHref, parseFacultyFollowUpSearchParams, facultyFollowupEmptyState,
} from "@/modules/courses/faculty-response-followup-model";
import { getFacultyResponseFollowUps } from "@/modules/courses/faculty-response-followup-service";
import {facultyFollowUpCsvHref} from "@/modules/courses/faculty-followup-export";

type Params = Record<string,string|string[]|undefined>;

export default async function FacultyResponseFollowUpsPage({
  searchParams,
}: { searchParams: Promise<Params> }) {
  const raw = await searchParams;
  const parsed = parseFacultyFollowUpSearchParams(raw);
  if (!parsed.success) return <section role="alert" className="space-y-3">
    <PageHeader title={"Invalid follow-up filters"} />
    <Link href="/teacher/response-followups" className="text-[var(--lms-link-text)] underline inline-flex min-h-11 md:min-h-9 items-center focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">Clear filters</Link>
  </section>;

  const context = await getCurrentRequestContext();
  const data = await getFacultyResponseFollowUps(context, parsed.data);
  const emptyState = facultyFollowupEmptyState(data.query,data.sections.length);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Faculty · Assessments" title="Response follow-ups"
      description="Published assessments past their due date with missing responses from learners in your current teaching Sections."
      actions={<Link href="/teacher/results"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] px-4 text-sm font-[650] text-[var(--lms-link-text)] sm:w-auto md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)] hover:bg-[rgba(38,186,199,0.07)] hover:underline">
        Results overview
      </Link>} />
    <form action="/teacher/response-followups" method="get"
      className="grid min-w-0 gap-3 border-b border-[var(--lms-canvas-border)] pb-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search
        <Input type="search" name="search" defaultValue={data.query.search} maxLength={120}
          placeholder="Course, Section or assessment"
          className="min-h-11 max-[767px]:text-[16px] md:min-h-9" />
      </label>
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Assessment type
        <Select name="kind" defaultValue={data.query.kind}
          className="min-h-11 md:min-h-9">
          <option value="ALL">All</option>
          <option value="ASSIGNMENT">Assignments</option>
          <option value="QUIZ">Quizzes</option>
        </Select>
      </label>
      <Disclosure title="More filters" defaultOpen={Boolean(data.query.deliveryId || data.query.sort !== "RECENT_DUE" || data.query.pageSize !== 5)} className="min-w-0 sm:col-span-2 lg:col-span-4" contentClassName="grid min-w-0 gap-3 py-3 md:grid-cols-2 lg:grid-cols-3">
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Teaching Section
        <Select name="deliveryId" defaultValue={data.query.deliveryId ?? ""}
          className="min-h-11 md:min-h-9">
          <option value="">All current Sections</option>
          {data.sections.map(section=><option key={section.deliveryId} value={section.deliveryId}>
            {section.courseCode} · {section.courseName} · {section.sectionName}
          </option>)}
        </Select>
      </label>
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sort
        <Select name="sort" defaultValue={data.query.sort}
          className="min-h-11 md:min-h-9">
          <option value="RECENT_DUE">Most recently due</option>
          <option value="OLDEST_DUE">Oldest overdue first</option>
          <option value="TITLE">Assessment title</option>
        </Select>
      </label>
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Assessments per page
        <Select name="pageSize" defaultValue={data.query.pageSize}
          className="min-h-11 md:min-h-9">
          <option value="5">5</option><option value="10">10</option>
        </Select>
      </label>
      </Disclosure>
      <Button type="submit" variant="primary" className="w-full sm:w-auto">
        Filter
      </Button>
      <Link href="/teacher/response-followups"
        className="inline-flex min-h-11 w-full items-center justify-center px-3 text-sm font-semibold text-[var(--lms-link-text)] sm:w-auto md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">Clear</Link>
    </form>
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-body leading-[22px]">
        {data.total.toLocaleString("en-IN")} matching past-due published assessment{data.total === 1 ? "" : "s"}
      </p>
      <Link href={facultyFollowUpCsvHref({...data.query,page:data.page})}
       className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] px-4 py-2 text-sm font-[650] text-[var(--lms-link-text)] sm:w-auto md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)] hover:bg-[rgba(38,186,199,0.07)] hover:underline">
        Export this page counts (no learner details)
      </Link>
    </div>
    {data.items.length === 0 ? <div className="space-y-3"><EmptyState title={emptyState.title}
      description={emptyState.description} />{emptyState.clearFilters ? <Link href="/teacher/response-followups" className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-[var(--lms-link-text)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">Clear follow-up filters</Link> : null}</div>
    : <div className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(item =>
      <article key={item.kind + ":" + item.deliveryId + ":" + item.id}
        className="min-w-0 space-y-3 bg-transparent py-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><h2 className="break-words text-base font-semibold leading-6 text-[var(--lms-heading)]">{item.title}</h2>
            <p className="mt-1 text-sm text-body leading-[22px]">{item.courseName} · {item.sectionName} · {item.kind}</p>
          </div>
          <span className="text-sm font-semibold text-body">{item.missingCount} without a recorded response</span>
        </div>
        {item.missingCount === 0 ? <p className="mt-3 text-sm text-body leading-[22px]">
          Every learner in the current Section roster has a recorded response.
        </p>
        : <Disclosure title="Learners without a recorded response" className="mt-2 border-b border-[var(--lms-canvas-border)]" contentClassName="min-w-0 pb-3">
          <ul className="mt-2 grid gap-2 md:grid-cols-2">
            {item.missingPreview.map(learner =>
              <li key={learner.id} className="min-w-0 border-b border-[var(--lms-canvas-border)] py-2 text-sm leading-6 text-body">
                {learner.displayName}
                {learner.rollNumber ? " · Roll " + learner.rollNumber : ""}
              </li>)}
          </ul>
          {item.hiddenCount > 0 ? <p className="mt-2 text-xs text-muted-foreground leading-5">
            {item.hiddenCount} additional learners; open the Section report for the complete list.
          </p> : null}
        </Disclosure>}
        <Link href={item.reportHref}
          className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-[var(--lms-link-text)] hover:underline sm:w-auto md:min-h-9 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Open authorized Section report →
        </Link>
      </article>)}</div>}
    {data.totalPages > 1 ? <Pagination label="Assessment follow-up pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>facultyResponseFollowUpHref({...data.query,page})} /> : null}
    <p className="max-w-prose text-xs leading-5 text-muted-foreground">
      Missing means no persisted submission or quiz attempt for a currently enrolled learner.
      It does not establish misconduct, failure or a notification being sent. No messages are sent
      from this view; up to ten assessments per page are expanded to keep work bounded.
    </p>
  </div>;
}
