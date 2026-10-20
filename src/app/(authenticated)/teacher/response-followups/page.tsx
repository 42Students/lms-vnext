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
    <Link href="/teacher/response-followups" className="text-primary-text underline inline-flex min-h-11 md:min-h-9 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear filters</Link>
  </section>;

  const context = await getCurrentRequestContext();
  const data = await getFacultyResponseFollowUps(context, parsed.data);
  const emptyState = facultyFollowupEmptyState(data.query,data.sections.length);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Faculty · Assessments" title="Response follow-ups"
      description="Published assessments past their due date with missing responses from learners in your current teaching Sections."
      actions={<Link href="/teacher/results"
        className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Results overview
      </Link>} />
    <form action="/teacher/response-followups" method="get"
      className="flex min-w-0 flex-wrap items-end gap-3 border-b border-border pb-4">
      <label className="grid gap-1 text-[13px] font-semibold leading-4 text-body">Search
        <Input type="search" name="search" defaultValue={data.query.search} maxLength={120}
          placeholder="Course, Section or assessment"
          className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
      </label>
      <label className="grid gap-1 text-[13px] font-semibold leading-4 text-body">Assessment type
        <Select name="kind" defaultValue={data.query.kind}
          className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
          <option value="ALL">All</option>
          <option value="ASSIGNMENT">Assignments</option>
          <option value="QUIZ">Quizzes</option>
        </Select>
      </label>
      <label className="grid gap-1 text-[13px] font-semibold leading-4 text-body">Teaching Section
        <Select name="deliveryId" defaultValue={data.query.deliveryId ?? ""}
          className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
          <option value="">All current Sections</option>
          {data.sections.map(section=><option key={section.deliveryId} value={section.deliveryId}>
            {section.courseCode} · {section.courseName} · {section.sectionName}
          </option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-[13px] font-semibold leading-4 text-body">Sort
        <Select name="sort" defaultValue={data.query.sort}
          className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
          <option value="RECENT_DUE">Most recently due</option>
          <option value="OLDEST_DUE">Oldest overdue first</option>
          <option value="TITLE">Assessment title</option>
        </Select>
      </label>
      <label className="grid gap-1 text-[13px] font-semibold leading-4 text-body">Assessments per page
        <Select name="pageSize" defaultValue={data.query.pageSize}
          className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
          <option value="5">5</option><option value="10">10</option>
        </Select>
      </label>
      <Button type="submit" variant="primary" className="min-h-11 md:min-h-9">
        Filter
      </Button>
      <Link href="/teacher/response-followups"
        className="inline-flex min-h-11 md:min-h-9 items-center px-3 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear</Link>
    </form>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-body">
        {data.total} matching past-due published assessment{data.total === 1 ? "" : "s"}
      </p>
      <Link href={facultyFollowUpCsvHref({...data.query,page:data.page})}
       className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Export this page counts (no learner details)
      </Link>
    </div>
    {data.items.length === 0 ? <div className="space-y-3"><EmptyState title={emptyState.title}
      description={emptyState.description} />{emptyState.clearFilters ? <Link href="/teacher/response-followups" className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear follow-up filters</Link> : null}</div>
    : <div className="grid gap-3">{data.items.map(item =>
      <article key={item.kind + ":" + item.deliveryId + ":" + item.id}
        className="min-w-0 rounded-xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-200 hover:border-[rgba(38,186,199,0.25)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary motion-reduce:transition-none md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="font-semibold text-foreground">{item.title}</h2>
            <p className="mt-1 text-sm text-body">{item.courseName} · {item.sectionName} · {item.kind}</p>
          </div>
          <span className="text-sm font-semibold text-body">{item.missingCount} without a recorded response</span>
        </div>
        {item.missingCount === 0 ? <p className="mt-3 text-sm text-body">
          Every learner in the current Section roster has a recorded response.
        </p>
        : <>
          <h3 className="mt-4 text-sm font-semibold text-foreground">Learners without a recorded response</h3>
          <ul className="mt-2 grid gap-2 md:grid-cols-2">
            {item.missingPreview.map(learner =>
              <li key={learner.id} className="rounded-[var(--lms-control-radius)] bg-surface-subtle px-3 py-2 text-sm text-body">
                {learner.displayName}
                {learner.rollNumber ? " · Roll " + learner.rollNumber : ""}
              </li>)}
          </ul>
          {item.hiddenCount > 0 ? <p className="mt-2 text-xs text-muted-foreground">
            {item.hiddenCount} additional learners; open the Section report for the complete list.
          </p> : null}
        </>}
        <Link href={item.reportHref}
          className="mt-4 inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Open authorized Section report →
        </Link>
      </article>)}</div>}
    <nav aria-label="Assessment follow-up pages" className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</p>
      <div className="flex gap-3">
        {data.page > 1 && <Link href={facultyResponseFollowUpHref({...data.query,page:data.page-1})}
          className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Previous</Link>}
        {data.page < data.totalPages && <Link href={facultyResponseFollowUpHref({...data.query,page:data.page+1})}
          className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Next</Link>}
      </div>
    </nav>
    <p className="text-xs leading-5 text-muted-foreground">
      Missing means no persisted submission or quiz attempt for a currently enrolled learner.
      It does not establish misconduct, failure or a notification being sent. No messages are sent
      from this view; up to ten assessments per page are expanded to keep work bounded.
    </p>
  </div>;
}
