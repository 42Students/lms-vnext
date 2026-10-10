import { describe, expect, it } from "vitest";
import {
  adminProgramsCsv,
  filterAdminPrograms,
  paginateAdminPrograms,
  type AdminProgramRow,
} from "@/modules/admin-ui/program-directory";

const program = (
  name: string,
  code: string,
  departmentName = "Computer Science",
): AdminProgramRow => ({
  id: code, name, code,
  departmentName, departmentId: "department-1", durationTerms: 8,
});

describe("W06 admin Programs directory", () => {
  it("searches name/code/department, sorts, and does not mutate input", () => {
    const rows = [
      program("Mechanical Eng", "MECH", "Mechanical"),
      program("Computer Science", "CSE"),
      program("Data Science", "DS"),
    ];
    expect(filterAdminPrograms(rows, "  comPUter ").map((p) => p.code))
      .toEqual(["CSE", "DS"]);
    expect(filterAdminPrograms(rows, "MECH").map((p) => p.code))
      .toEqual(["MECH"]);
    expect(rows[0]?.code).toBe("MECH");
  });

  it("paginates with safe bounds", () => {
    const rows = Array.from({ length: 24 }, (_, index) =>
      program("Program " + index, String(index)),
    );
    expect(paginateAdminPrograms(rows, 1).items).toHaveLength(10);
    expect(paginateAdminPrograms(rows, 3).items).toHaveLength(4);
    expect(paginateAdminPrograms(rows, 99).page).toBe(3);
    expect(paginateAdminPrograms(rows, -2).page).toBe(1);
  });

  it("exports only filtered programs and quotes untrusted cells", () => {
    const result = adminProgramsCsv([
      program('B.Tech "Computer", Engineering', "BTECH"),
    ]);
    expect(result).toContain('"B.Tech ""Computer"", Engineering"');
    expect(result).toContain('"Duration Terms"');
    expect(result.split("\r\n")).toHaveLength(3);
  });

  it("neutralizes formulas in imported department/program/code labels", () => {
    const result = adminProgramsCsv([
      program("  =CMD()", "+SUM(1,1)", "-BAD"),
    ]);
    expect(result).toContain('"\'  =CMD()"');
    expect(result).toContain('"\'+SUM(1,1)"');
    expect(result).toContain('"\'-BAD"');
  });
});
