import { describe, expect, it } from "vitest";
import { facultyRosterCsv, facultyRosterFileName } from "@/modules/courses/faculty-roster-export";

const base = { membershipId:"learner-a",displayName:"Asha",rollNumber:"R1",email:"asha@example.com",phoneE164:"+919123456789" };
describe("Faculty authorized roster CSV export", () => {
  it("exports exactly passed learner rows with stable fields and safe phone values", () => {
    const csv=facultyRosterCsv([base]);
    expect(csv).toContain("Student,Roll number,Email,Phone\r\n");
    expect(csv).toContain("\"Asha\",\"R1\",\"asha@example.com\",\"'+919123456789\"");
    expect(csv).not.toContain("learner-b");
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(2);
  });
  it("neutralizes spreadsheet-formula injection and escapes CSV quoting", () => {
    const csv=facultyRosterCsv([{...base,displayName:' =HYPERLINK("https://evil.example")',rollNumber:'@SUM(1,2)',email:'x"@example.com'}]);
    expect(csv).toContain("\"' =HYPERLINK(\"\"https://evil.example\"\")\"");
    expect(csv).toContain("\"'@SUM(1,2)\"");
    expect(csv).toContain('"x""@example.com"');
  });
  it("preserves UTF-8 names and creates deterministic filenames", () => {
    expect(facultyRosterCsv([{...base,displayName:"రాము"}])).toContain("రాము");
    expect(facultyRosterCsv([])).toBe("Student,Roll number,Email,Phone\r\n");
    expect(facultyRosterFileName("Section A / 2026")).toBe("faculty-roster-section-a-2026.csv");
  });
});
