import { describe, expect, it } from "vitest";
import {
  departmentRowsCsv,
  filterDepartmentRows,
  pageDepartmentRows,
  type DepartmentDirectoryRow,
} from "@/modules/admin-ui/department-directory";

function row(
  name: string, id = name,
  usage: DepartmentDirectoryRow["usage"] = { programs: 0, courses: 0, faculty: 0 },
): DepartmentDirectoryRow {
  return { id, name, createdAt: "2026-10-10T00:00:00.000Z", usage };
}

describe("W06 Departments directory parity", () => {
  it("searches names case-insensitively, sorts and leaves source rows untouched", () => {
    const source = [row("Mechanical"), row("Computer Science"), row("Computing")];
    expect(filterDepartmentRows(source, "  COMpuT  ").map((x) => x.name))
      .toEqual(["Computer Science", "Computing"]);
    expect(source[0]?.name).toBe("Mechanical");
    expect(filterDepartmentRows(source, "unknown")).toHaveLength(0);
  });

  it("paginates deterministically and clamps invalid page numbers", () => {
    const source = Array.from({ length: 25 }, (_, i) =>
      row(`Department ${String(i).padStart(2, "0")}`, String(i)),
    );
    expect(pageDepartmentRows(source, 1).items).toHaveLength(10);
    expect(pageDepartmentRows(source, 3).items).toHaveLength(5);
    expect(pageDepartmentRows(source, 4).page).toBe(3);
    expect(pageDepartmentRows(source, -100).page).toBe(1);
  });

  it("exports exactly the visible scoped rows and unknown counts as blanks", () => {
    const csv = departmentRowsCsv([row('Civil "Core", Division', "dept-1", null)]);
    expect(csv).toContain('"dept-1","Civil ""Core"", Division","","",""');
    expect(csv).not.toContain('"0","0","0"');
    expect(csv.split("\r\n")).toHaveLength(3);
  });

  it("prevents spreadsheet formula execution while preserving CSV quoting", () => {
    const payloads = [
      "=HYPERLINK(\"https://evil.test\",\"Open\")",
      "+SUM(1,1)",
      "-1+2",
      "@SUM(1)",
      "  =1+2",
      "\t=2+2",
      "\n=3+3",
    ];
    const csv = departmentRowsCsv(payloads.map((name, i) => row(name, String(i))));
    for (const payload of payloads) {
      const escaped = ("'" + payload).replaceAll('"', '""');
      expect(csv).toContain(`"${escaped}"`);
    }
  });
});
