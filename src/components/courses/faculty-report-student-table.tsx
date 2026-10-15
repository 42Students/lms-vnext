"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { facultyReportIstTimestamp } from "@/modules/courses/faculty-report-time";
import { facultyReportStudentPage, type FacultyReportStudentRow } from "@/modules/courses/faculty-report-students";

export function FacultyReportStudentTable({
  rows,
  title,
}: {
  rows: readonly FacultyReportStudentRow[];
  title: string;
}) {
  const [search, setSearch] = useState("");
  const [requestedPage, setRequestedPage] = useState(1);
  const result = useMemo(
    () => facultyReportStudentPage(rows, search, requestedPage),
    [rows, search, requestedPage],
  );
  const formatDate = facultyReportIstTimestamp;

  return (
    <section aria-label={title} className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
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
        <p className="mt-4 text-sm text-body">No learners have submitted yet.</p>
      ) : result.rows.length === 0 ? (
        <p className="mt-4 text-sm text-body">No students match this search.</p>
      ) : (
        <>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th scope="col" className="py-2 pr-3">Learner</th>
                  <th scope="col" className="py-2 pr-3">Score</th>
                  <th scope="col" className="py-2 pr-3">Submitted</th>
                  <th scope="col" className="py-2 pr-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.rows.map((student) => (
                  <tr key={student.id}>
                    <td className="py-3 pr-3 font-semibold text-foreground">
                      {student.name}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="font-semibold text-foreground">
                        {student.percent === null ? "—" : student.percent + "%"}
                      </span>
                      <span className="block text-xs text-muted-foreground">{student.score}</span>
                    </td>
                    <td className="py-3 pr-3">{formatDate(student.submittedAt)}</td>
                    <td className="py-3 pr-3">{student.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-3 md:hidden">
            {result.rows.map((student) => (
              <article key={student.id} className="rounded-lg border border-border p-4">
                <h3 className="font-semibold text-foreground">{student.name}</h3>
                <p className="mt-2 text-sm text-body">
                  <strong>{student.percent === null ? "Not graded" : student.percent + "%"}</strong>
                  {" · "}{student.score}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(student.submittedAt)} · {student.note}</p>
              </article>
            ))}
          </div>
        </>
      )}

      {result.pages > 1 ? (
        <nav aria-label="Report student pages" className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={result.page === 1}
            onClick={() => setRequestedPage(result.page - 1)}
            className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground">Page {result.page} of {result.pages}</span>
          <button
            type="button"
            disabled={result.page >= result.pages}
            onClick={() => setRequestedPage(result.page + 1)}
            className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </nav>
      ) : null}
    </section>
  );
}
