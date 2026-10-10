/**
 * W06 presentational contracts for the legacy Departments directory.
 * Data is already scoped and permission-checked server-side; this module
 * has no DB access or authority to select another college.
 */
export type DepartmentDirectoryRow = {
  id: string;
  name: string;
  createdAt: string;
  usage: {
    programs: number;
    courses: number;
    faculty: number;
  } | null;
};

export function filterDepartmentRows(
  rows: readonly DepartmentDirectoryRow[],
  search: string,
): DepartmentDirectoryRow[] {
  const q = search.trim().toLocaleLowerCase("en-IN");
  return rows.filter((row) =>
    row.name.toLocaleLowerCase("en-IN").includes(q),
  ).sort((a, b) => a.name.localeCompare(b.name, "en-IN"));
}

export function pageDepartmentRows(
  rows: readonly DepartmentDirectoryRow[],
  page: number,
  pageSize = 10,
) {
  const size = Math.max(1, Math.min(100, Math.trunc(pageSize) || 10));
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const currentPage = Math.min(pageCount, Math.max(1, Math.trunc(page) || 1));
  return {
    page: currentPage,
    pages: pageCount,
    total: rows.length,
    items: rows.slice((currentPage - 1) * size, currentPage * size),
  };
}

function csvCell(value: string | number | null | undefined) {
  const raw = value === null || value === undefined ? "" : String(value);
  // Excel and LibreOffice execute cells starting with =,+,-,@, including
  // those prefixed by whitespace or control characters. Prefix as text.
  const safe = /^[\s\u200b]*[=+\-@]/u.test(raw) ? "'" + raw : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function departmentRowsCsv(
  rows: readonly DepartmentDirectoryRow[],
): string {
  const columns = [
    "ID", "Department Name", "Programs", "Courses", "Faculty",
  ];
  const data = rows.map((row) => [
    row.id,
    row.name,
    row.usage?.programs ?? "",
    row.usage?.courses ?? "",
    row.usage?.faculty ?? "",
  ]);
  return [columns, ...data].map((line) =>
    line.map(csvCell).join(","),
  ).join("\r\n") + "\r\n";
}
