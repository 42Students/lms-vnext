import { describe, expect, it } from "vitest";
import { facultyReportStudentPage } from "@/modules/courses/faculty-report-students";

describe("Faculty report bounded learner pages", () => {
  it("caps requested size and clamps a stale page after filters", () => {
    const rows = Array.from({length: 125}, (_,i) => ({id: String(i),name:"Learner "+i,email:null,score:"",percent:null,submittedAt:null,note:""}));
    expect(facultyReportStudentPage(rows,"",1,100000).rows).toHaveLength(100);
    const filtered=facultyReportStudentPage(rows,"Learner 124",999,100000);
    expect(filtered.page).toBe(1);
    expect(filtered.rows).toHaveLength(1);
  });
});
