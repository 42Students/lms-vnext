export type AdminProgramRow = {
  id: string;
  name: string;
  code: string;
  departmentName: string;
  departmentId: string;
  durationTerms: number;
};

export function filterAdminPrograms(
  rows: readonly AdminProgramRow[],
  query: string,
): AdminProgramRow[] {
  const search = query.trim().toLocaleLowerCase("en-IN");
  return rows.filter((row) =>
    [row.name, row.code, row.departmentName].some((text) =>
      text.toLocaleLowerCase("en-IN").includes(search),
    ),
  ).sort((a, b) =>
    a.departmentName.localeCompare(b.departmentName, "en-IN") ||
    a.name.localeCompare(b.name, "en-IN") ||
    a.id.localeCompare(b.id),
  );
}

export function paginateAdminPrograms(
  rows: readonly AdminProgramRow[],
  page: number,
  size = 10,
) {
  const pageSize = Math.max(1, Math.min(100, Math.trunc(size) || 10));
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.max(1, Math.min(pageCount, Math.trunc(page) || 1));
  return {
    page: currentPage,
    pages: pageCount,
    total: rows.length,
    items: rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
  };
}

function quoteCsv(raw: string | number) {
  const value = String(raw);
  const neutralized = /^[\s\u200b]*[=+\-@]/u.test(value)
    ? "'" + value
    : value;
  return `"${neutralized.replaceAll('"', '""')}"`;
}

export function adminProgramsCsv(rows: readonly AdminProgramRow[]) {
  const data: (string | number)[][] = [
    ["ID", "Program", "Code", "Department", "Duration Terms"],
    ...rows.map((row) => [
      row.id, row.name, row.code, row.departmentName, row.durationTerms,
    ]),
  ];
  return data.map((row) => row.map(quoteCsv).join(",")).join("\r\n") + "\r\n";
}
