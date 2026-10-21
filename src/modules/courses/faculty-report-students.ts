export type FacultyReportStudentRow = {
  id: string;
  name: string;
  score: string;
  percent: number | null;
  submittedAt: string | null;
  note: string;
};

export const FACULTY_REPORT_PAGE_SIZE = 20;

/** Matches legacy Faculty report student-name search and best-score-first ordering. */
export function facultyReportStudentPage(
  students: readonly FacultyReportStudentRow[],
  rawSearch: string,
  requestedPage: number,
  pageSize = FACULTY_REPORT_PAGE_SIZE,
) {
  const query = rawSearch.trim().toLocaleLowerCase();
  const filtered = students
    .filter((student) =>
      !query || student.name.toLocaleLowerCase().includes(query),
    )
    // Array.prototype.sort is stable. Equal scores keep the scoped response
    // order, matching the legacy assignment and quiz ranking table.
    .sort((left, right) =>
      (right.percent ?? -1) - (left.percent ?? -1),
    );
  const size = Number.isInteger(pageSize) && pageSize > 0
    ? Math.min(pageSize, 100)
    : FACULTY_REPORT_PAGE_SIZE;
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const page = Math.min(Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1), pages);
  return {
    count: filtered.length,
    pages,
    page,
    rows: filtered.slice((page - 1) * size, page * size),
  };
}

/** Report labels are display names only; missing identities never fall back to contact data. */
export function facultyReportLearnerName(displayName: string | null | undefined): string {
  return displayName?.trim() || "Unknown student";
}
