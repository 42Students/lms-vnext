import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  collegeAssessmentHref,
  collegeAssessmentSummary,
  collegeAssessmentScopeLabel,
  type CollegeAssessmentAggregateItem,
  type CollegeAssessmentKind,
  type CollegeAssessmentListQuery,
} from "@/modules/courses/college-assessment-aggregate-model";

type Data = {
  kind: CollegeAssessmentKind;
  query: CollegeAssessmentListQuery;
  items: CollegeAssessmentAggregateItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function formatDue(value: Date | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value) + " IST";
}

export function CollegeAssessmentAggregate({ data }: { data: Data }) {
  const isAssignment = data.kind === "ASSIGNMENT";
  const name = isAssignment ? "Assignments" : "Quizzes";
  const summary = collegeAssessmentSummary(data.items);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin · Courses & Content"
        title={name}
        description={
          "College-wide persisted " + name.toLowerCase() +
          " across all course offerings and lessons. Read-only oversight; " +
          "course authoring and review remain in their offering workspaces."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={isAssignment ? "/college/quizzes" : "/college/assignments"}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
              {isAssignment ? "View quizzes" : "View assignments"}
            </Link>
            <Link href="/college/courses"
              className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
              Course catalogue
            </Link>
          </div>
        }
      />

      <section aria-label="Assessment directory filters"
        className="rounded-xl border border-border bg-surface p-5">
        <form method="get"
          action={isAssignment ? "/college/assignments" : "/college/quizzes"}
          className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-52 flex-1 gap-1 text-sm font-semibold text-body">
            Search title
            <input name="q" type="search" maxLength={100}
              defaultValue={data.query.q} placeholder="Assessment title"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Exact course code
            <input name="courseCode" type="search" maxLength={64} defaultValue={data.query.courseCode??""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Batch / cohort code (exact)
            <input name="cohortCode" type="search" maxLength={64} defaultValue={data.query.cohortCode??""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Audience scope
            <select name="scope" defaultValue={data.query.scope}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">All scopes</option><option value="SHARED">Shared offering</option>
              <option value="SECTION">Section-specific</option>
            </select>
          </label>
          {!isAssignment?<label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Quiz results
            <select name="results" defaultValue={data.query.results}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">Any visibility</option><option value="PUBLISHED">Results published</option>
              <option value="HIDDEN">Results hidden</option>
            </select>
          </label>:null}
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Due-date configuration
            <select name="duePresence" defaultValue={data.query.duePresence}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">All deadlines</option><option value="SCHEDULED">Deadline configured</option>
              <option value="UNSCHEDULED">No deadline</option>
            </select>
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Deadline window
            <select name="dueWindow" defaultValue={data.query.dueWindow}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">Any deadline</option><option value="PAST">Deadline passed</option>
              <option value="FUTURE">Deadline upcoming</option>
            </select>
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Academic period code
            <input name="periodCode" type="search" maxLength={64} defaultValue={data.query.periodCode??""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
          </label>
          <label className="grid min-w-40 gap-1 text-sm font-semibold text-body">
            Status
            <select name="status" defaultValue={data.query.status}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              {!isAssignment ? <option value="CLOSED">Closed</option> : null}
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <button type="submit"
            className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary">
            Filter
          </button>
          <Link href={collegeAssessmentHref(data.kind, { q: "", scope: "ALL", results: "ALL", duePresence: "ALL", dueWindow: "ALL", status: "ALL", page: 1 })}
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Clear
          </Link>
        </form>
      </section>

      <section aria-label="Displayed assessment summary" className="grid gap-3 sm:grid-cols-3">
        {[
          ["Matching records", data.total],
          ["Published on this page", summary.published],
          [isAssignment ? "Submitted records on this page" : "Quiz attempts on this page", summary.activity],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
          </article>
        ))}
      </section>

      <section aria-label={name + " records"} className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface">
        {data.items.length === 0 ? (
          <p className="p-6 text-sm text-body">
            {data.total === 0
              ? "No recorded assessments match these filters. This does not imply courses or lessons are absent."
              : "There are no results on this page. Return to an earlier page."}
          </p>
        ) : (
          <>
            <div className="divide-y divide-border sm:hidden">
              {data.items.map(item=><article key={item.id} className="min-w-0 space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="min-w-0 break-words text-base font-semibold text-foreground">{item.title}</h2>
                  <StatusBadge tone={item.status==="PUBLISHED"?"success":"neutral"}>{item.status}</StatusBadge>
                </div>
                <Link href={"/college/courses/offerings/"+encodeURIComponent(item.offeringId)}
                  className="inline-block min-h-11 break-words py-2 text-sm font-semibold text-primary-text">
                  {item.courseName} ({item.courseCode})
                </Link>
                <p className="break-words text-sm text-body">{item.lessonName}</p>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div><dt className="font-semibold text-muted-foreground">Audience</dt><dd>{collegeAssessmentScopeLabel(item.deliverySpecific)}</dd></div>
                  <div><dt className="font-semibold text-muted-foreground">Maximum points</dt><dd>{item.points}</dd></div>
                  <div><dt className="font-semibold text-muted-foreground">Due</dt><dd>{formatDue(item.dueAt)}</dd></div>
                  <div><dt className="font-semibold text-muted-foreground">{isAssignment?"Submissions":"Attempts"}</dt><dd>{item.activityCount}</dd></div>
                  {!isAssignment?<div className="col-span-2"><dt className="font-semibold text-muted-foreground">Results</dt><dd>{item.resultsPublished?"Published":"Hidden"}</dd></div>:null}
                </dl>
              </article>)}
            </div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">{isAssignment ? "Assignment" : "Quiz"}</th>
                <th scope="col" className="px-4 py-3">Course / lesson</th>
                <th scope="col" className="px-4 py-3">Scope</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Due (IST)</th>
                <th scope="col" className="px-4 py-3">{isAssignment ? "Submissions" : "Attempts"}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-t border-border align-top">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Maximum {item.points} points</p>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={"/college/courses/offerings/" + encodeURIComponent(item.offeringId)}
                      className="font-semibold text-primary-text hover:underline">
                      {item.courseName} ({item.courseCode})
                    </Link>
                    <p className="mt-1 text-xs text-body">{item.lessonName}</p>
                  </td>
                  <td className="px-4 py-4 text-body">
                    {collegeAssessmentScopeLabel(item.deliverySpecific)}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge tone={item.status === "PUBLISHED" ? "success" : "neutral"}>
                      {item.status}
                    </StatusBadge>
                    {!isAssignment?<p className="mt-1 text-xs text-muted-foreground">{item.resultsPublished?"Results published":"Results hidden"}</p>:null}
                  </td>
                  <td className="px-4 py-4 text-body">{formatDue(item.dueAt)}</td>
                  <td className="px-4 py-4 tabular-nums text-body">{item.activityCount}</td>
                </tr>
              ))}
            </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <nav aria-label={name + " pagination"}
        className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {data.page} of {data.totalPages} · {data.total} records · 25/page
        </p>
        <div className="flex gap-2">
          {data.page > 1 ? (
            <Link href={collegeAssessmentHref(data.kind, { ...data.query, page: data.page - 1 })}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
              Previous
            </Link>
          ) : null}
          {data.page < data.totalPages ? (
            <Link href={collegeAssessmentHref(data.kind, { ...data.query, page: data.page + 1 })}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
              Next
            </Link>
          ) : null}
        </div>
      </nav>

      <p className="text-xs leading-5 text-muted-foreground">
        Counts represent persisted {isAssignment ? "submission rows" : "attempt rows"},
        not distinct eligible learners or submission-completion rates.
        Draft and archived items remain visible to authorized College Admins.
        No answers, submission content, contact information or file keys are read.
        Exact legacy authoring actions, report drill-ins, browser parity and runtime
        integration verification remain open.
      </p>
    </div>
  );
}
