/**
 * W06 presentational contracts for the legacy Departments directory.
 * Data is already scoped and permission-checked server-side; this module
 * has no DB access or authority to select another college.
 */
export type DepartmentDirectoryRow = {
  id: string;
  name: string;
  /** Legacy search metadata, supplied by the authorized college reader only. */
  collegeId?:string;
  collegeName?:string|null;
  deptChairId?:string|null;
  deptViceChairId?:string|null;
  legacyDepartmentId?:number|null;
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
  const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("en-IN").trim();
  const q=normalize(search);
  if(!q)return [...rows]; // Legacy no-search selection follows source order.
  const synonyms:Readonly<Record<string,string>>={
    cse:"computer science",ece:"electronics",eee:"electrical",mech:"mechanical",
    civil:"civil engineering",chem:"chemical",bio:"biotechnology",
    maths:"mathematics",physics:"physics",chemistry:"chemistry",
  };
  const candidates=[q,...Object.entries(synonyms)
    .filter(([alias,meaning])=>q===alias||q===meaning)
    .map(([alias,meaning])=>q===alias?meaning:alias)];
  return rows.filter(row=>{
    const searchable=normalize([row.name,row.collegeName??""].join(" "));
    return candidates.some(term=>searchable.includes(term));
  }).sort((a,b)=>{
    const aName=normalize(a.name),bName=normalize(b.name);
    const aRank=aName===q?0:aName.startsWith(q)?1:2;
    const bRank=bName===q?0:bName.startsWith(q)?1:2;
    return aRank-bRank||a.name.localeCompare(b.name,"en-IN")||a.id.localeCompare(b.id);
  });
}

export function pageDepartmentRows(
  rows: readonly DepartmentDirectoryRow[],
  page: number,
  pageSize = 10,
) {
  const size = Number.isFinite(pageSize)?Math.max(1, Math.min(100, Math.trunc(pageSize) || 10)):10;
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const currentPage = Number.isFinite(page)?Math.min(pageCount, Math.max(1, Math.trunc(page) || 1)):1;
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
    "id", "name", "programs", "courses", "faculty",
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
