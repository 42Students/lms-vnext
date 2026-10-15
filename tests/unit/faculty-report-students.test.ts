import { describe, expect, it } from "vitest";
import { facultyReportStudentPage, type FacultyReportStudentRow } from "@/modules/courses/faculty-report-students";

const row = (id: number, name: string, percent: number | null): FacultyReportStudentRow => ({
  id: String(id),
  name,
  score: percent === null ? "Not graded" : percent + "/100",
  percent,
  submittedAt: "2026-10-13T00:00:00.000Z",
  note: "On time",
});

describe("Faculty report student table model", () => {
  it("sorts by score descending and places ungraded learners last", () => {
    const result = facultyReportStudentPage([row(1, "B", null), row(2, "A", 40), row(3, "C", 100)], "", 1);
    expect(result.rows.map((item) => item.id)).toEqual(["3", "2", "1"]);
  });

  it("searches names without using private learner email", () => {
    const result = facultyReportStudentPage([row(1, "Asha Rao", 70), row(2, "Ravi Kumar", 40)], "  asha rao  ", 1);
    expect(result.rows.map((item) => item.name)).toEqual(["Asha Rao"]);
    expect(result.count).toBe(1);
  });

  it("paginates full large classes without silently truncating the roster", () => {
    const rows = Array.from({ length: 67 }, (_, index) => row(index, "Learner " + index, index));
    const last = facultyReportStudentPage(rows, "", 999);
    expect(last.count).toBe(67);
    expect(last.pages).toBe(4);
    expect(last.page).toBe(4);
    expect(last.rows).toHaveLength(7);
  });

  it("does not crash on empty or invalid pagination", () => {
    const result = facultyReportStudentPage([], "nobody", Number.NaN, 0);
    expect(result).toEqual({ count: 0, pages: 1, page: 1, rows: [] });
  });
});


describe("Faculty report bounded learner pages", () => {
  it("caps requested size and clamps a stale page after filters", () => {
    const rows = Array.from({length: 125}, (_,i) => ({id: String(i),name:"Learner "+i,score:"",percent:null,submittedAt:null,note:""}));
    expect(facultyReportStudentPage(rows,"",1,100000).rows).toHaveLength(100);
    const filtered=facultyReportStudentPage(rows,"Learner 124",999,100000);
    expect(filtered.page).toBe(1);
    expect(filtered.rows).toHaveLength(1);
  });
});


describe("Faculty report contact minimization", () => {
  it("never requires or searches a learner email in the report roster", () => {
    const result = facultyReportStudentPage([row(1,"Ravi",60)],"ravi@example.edu",1);
    expect(result.rows).toEqual([]);
  });
});
