"use client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { facultyReportIstTimestamp } from "@/modules/courses/faculty-report-time";
import { facultyReportStudentPage, type FacultyReportStudentRow } from "@/modules/courses/faculty-report-students";

export function FacultyReportStudentTable({
  rows,
  title,
  emptyMessage = "No learners have submitted yet.",
}: {
  rows: readonly FacultyReportStudentRow[];
  title: string;
  emptyMessage?: string;
}) {
  const [search, setSearch] = useState("");
  const [requestedPage, setRequestedPage] = useState(1);
  const result = useMemo(
    () => facultyReportStudentPage(rows, search, requestedPage),
    [rows, search, requestedPage],
  );
  const formatDate = facultyReportIstTimestamp;

  return (
    <section aria-label={title} className="min-w-0 space-y-3">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--lms-heading)]">{title}</h2>
          <p aria-live="polite" className="mt-1 text-xs text-muted-foreground">
            Showing {result.rows.length===0?0:(result.page-1)*20+1}–{Math.min(result.count,result.page*20)} of {result.count} learners · Highest scores first · 20 per page
          </p>
        </div>
        {rows.length > 8 ? (
          <label className="w-full min-w-0 text-[length:var(--lms-font-sm)] sm:max-w-sm font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Search students
            <Input
              aria-label="Search report students"
              className="mt-[6px] min-h-11 md:min-h-9"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setRequestedPage(1); }}
              placeholder="Name"
            />
          </label>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <EmptyState title={emptyMessage} />
      ) : result.rows.length === 0 ? (
        <EmptyState title="No students match this search." />
      ) : (
        <div className="mt-4 min-w-0">
          <DataTable
            caption={title}
            rows={result.rows}
            getRowKey={student=>student.id}
            empty={<EmptyState title="No students match this search." />}
            columns={[
              {key:"learner",header:"Learner",mobilePriority:"primary" as const,
                cell:(student)=><strong className="break-words text-foreground">{student.name}</strong>},
              {key:"score",header:"Score",mobilePriority:"secondary" as const,
                cell:(student)=><span>
                  <strong className="text-foreground">{student.percent===null?"Not graded":student.percent+"%"}</strong>
                  <span className="block text-xs text-muted-foreground">{student.score}</span>
                </span>},
              {key:"submitted",header:"Submitted",mobilePriority:"secondary" as const,
                cell:(student)=>formatDate(student.submittedAt)},
              {key:"details",header:"Details",mobilePriority:"secondary" as const,
                cell:(student)=>student.note},
            ]}
          />
        </div>

      )}

      {result.pages > 1 ? (
        <nav aria-label="Report student pages" className="mt-4 flex min-w-0 items-center justify-between gap-2 flex-wrap">
          <Button variant="secondary"
            type="button"
            disabled={result.page === 1}
            onClick={() => setRequestedPage(result.page - 1)}
            className="min-h-11 min-w-24 md:min-h-9"
          >
            Previous
          </Button>
          <span role="status" className="text-xs font-semibold text-muted-foreground">Page {result.page} of {result.pages}</span>
          <Button variant="secondary"
            type="button"
            disabled={result.page >= result.pages}
            onClick={() => setRequestedPage(result.page + 1)}
            className="min-h-11 min-w-24 md:min-h-9"
          >
            Next
          </Button>
        </nav>
      ) : null}
    </section>
  );
}
