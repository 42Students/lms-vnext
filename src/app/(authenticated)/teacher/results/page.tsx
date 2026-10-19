import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { parseFacultyResultsSearchParams, facultyResultsHref, facultyRecordedResponseRate, facultyResultsEmptyState } from "@/modules/courses/faculty-results-model";
import { getFacultyAssessmentResults } from "@/modules/courses/faculty-results-service";
import {facultyResultsCsvHref} from "@/modules/courses/faculty-results-export";

type Search = Record<string,string|string[]|undefined>;

export default async function FacultyAssessmentResultsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const raw = await searchParams;
  const parsed = parseFacultyResultsSearchParams(raw);
  if (!parsed.success) {
    return <section role="alert" className="space-y-3">
      <h1 className="font-semibold text-[30px] text-[var(--lms-heading)]">Invalid assessment filters</h1>
      <Link href="/teacher/results" className="text-[var(--lms-teal-deep)] underline inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Clear filters</Link>
    </section>;
  }
  const context = await getCurrentRequestContext();
  const data = await getFacultyAssessmentResults(context,parsed.data);
  const emptyState = facultyResultsEmptyState(data.query,data.sections.length);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Faculty · Assessments" title="Assessment results"
      description="Section-specific recorded response counts and scores from your current teaching assignments."
      actions={<div className="flex flex-wrap gap-2">
        <Link href="/teacher/response-followups"
          className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
          Response follow-ups
        </Link>
        <Link href="/teacher/allAssignments"
          className="rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-[var(--lms-teal-deep)] inline-flex min-h-9 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
          All Assignments
        </Link>
      </div>} />
    <form method="get" action="/teacher/results"
      className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm font-semibold text-body">Search
        <Input name="search" type="search" maxLength={120} defaultValue={data.query.search}
          
          placeholder="Assessment, course code or Section" />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Type
        <Select name="kind" defaultValue={data.query.kind} >
          <option value="ALL">All</option>
          <option value="ASSIGNMENT">Assignments</option>
          <option value="QUIZ">Quizzes</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Teaching Section
        <Select name="deliveryId" aria-label="Teaching Section" defaultValue={data.query.deliveryId ?? ""} >
          <option value="">All teaching sections</option>
          {data.sections.map(section => (
            <option key={section.deliveryId} value={section.deliveryId}>
              {section.courseCode} · {section.courseName} · {section.sectionName}
            </option>
          ))}
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Status
        <Select name="status" defaultValue={data.query.status} >
          <option value="ALL">All</option>
          <option value="PUBLISHED">Published</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Due date
        <Select name="due" defaultValue={data.query.due} >
          <option value="ALL">All due dates</option>
          <option value="OVERDUE">Past due, published</option>
          <option value="UPCOMING">Upcoming due</option>
          <option value="UNDATED">No due date</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Sort
        <Select name="sort" defaultValue={data.query.sort} >
          <option value="DUE_DESC">Latest due date</option>
          <option value="DUE_ASC">Earliest due date</option>
          <option value="TITLE">Assessment title</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Records per page
        <Select name="pageSize" defaultValue={data.query.pageSize} >
          <option value="5">5</option><option value="10">10</option>
        </Select>
      </label>
      <Button type="submit" >
        Filter
      </Button>
      <Link href="/teacher/results" className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
        Clear
      </Link>
    </form>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-body" role="status" aria-live="polite">{data.total} matching Section-assessment record{data.total === 1 ? "" : "s"}</p>
      <Link href={facultyResultsCsvHref({...data.query,page:data.page})}
       className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
       Export this page CSV (no learner names)
      </Link>
    </div>
    {data.items.length === 0 ? <div className="space-y-3"><EmptyState title={emptyState.title}
      description={emptyState.description} />{emptyState.clearFilters ? <Link href="/teacher/results" className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Clear result filters</Link> : null}</div>
      : <div className="grid gap-3">
        {data.items.map(item =>
          <article key={item.kind + ":" + item.deliveryId + ":" + item.id}
            className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-foreground">{item.title}</h2>
                <p className="mt-1 text-sm text-body">{item.courseName} · {item.sectionName} · {item.kind}</p>
              </div>
              <span className="text-xs font-semibold text-body">{item.status}</span>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {([
                ["Eligible", item.eligible],
                ["Responded", item.responded],
                ["No recorded response", item.pending],
                ["Response rate", (() => {
                  const rate = facultyRecordedResponseRate(item.eligible, item.responded);
                  return rate === null ? "Unknown" : rate + "%";
                })()],
                ["Average graded score", item.averagePercent === null
                  ? "Unknown" : item.averagePercent + "%"],
              ] as const).map(([label,value]) =>
                <div key={label}>
                  <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-lg font-semibold text-foreground">{value}</dd>
                </div>)}
            </dl>
            <Link href={item.reportHref}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
              Open Section report →
            </Link>
          </article>)}
      </div>}
    <nav aria-label="Assessment result pages" className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</p>
      <div className="flex gap-3">
        {data.page > 1 && <Link href={facultyResultsHref({...data.query,page:data.page-1})}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Previous</Link>}
        {data.page < data.totalPages && <Link href={facultyResultsHref({...data.query,page:data.page+1})}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Next</Link>}
      </div>
    </nav>
    <p className="text-xs leading-5 text-muted-foreground">
      At most ten assessments are summarized per page to bound database work.
      Results use existing authorized Section report readers. Missing responses
      are not graded failures, and unknown averages are not zero.
      Draft/private results are not evidence of learner-visible grades.
    </p>
  </div>;
}
