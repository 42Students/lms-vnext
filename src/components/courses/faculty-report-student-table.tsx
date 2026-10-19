"use client";
import {Button} from "@/components/ui/button";

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
    <section aria-label={title} className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--lms-heading)]">{title}</h2>
          <p aria-live="polite" className="mt-1 text-xs text-muted-foreground">
            {result.count} of {rows.length} learners · Highest scores first
          </p>
        </div>
        {rows.length > 8 ? (
          <label className="w-full max-w-sm text-xs font-semibold text-body">
            Search students
            <Input
              aria-label="Search report students"
              className="mt-1"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setRequestedPage(1); }}
              placeholder="Name"
            />
          </label>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-body">{emptyMessage}</p>
      ) : result.rows.length === 0 ? (
        <p className="mt-4 text-sm text-body">No students match this search.</p>
      ) : (
        <div className="mt-4 min-w-0">
          <DataTable
            caption={title}
            rows={result.rows}
            getRowKey={student=>student.id}
            empty={<p className="text-sm text-body">No students match this search.</p>}
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
        <nav aria-label="Report student pages" className="mt-4 flex items-center justify-between gap-3">
          <Button variant="secondary"
            type="button"
            disabled={result.page === 1}
            onClick={() => setRequestedPage(result.page - 1)}
            className="min-h-11"
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {result.page} of {result.pages}</span>
          <Button variant="secondary"
            type="button"
            disabled={result.page >= result.pages}
            onClick={() => setRequestedPage(result.page + 1)}
            className="min-h-11"
          >
            Next
          </Button>
        </nav>
      ) : null}
    </section>
  );
}
