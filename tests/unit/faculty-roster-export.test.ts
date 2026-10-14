import { describe, expect, it } from "vitest";
import { facultyRosterCsv, facultyRosterFileName } from "@/modules/courses/faculty-roster-export";

const base = { membershipId:"learner-a",displayName:"Asha",rollNumber:"R1",email:"asha@example.com",phoneE164:"+919123456789" };
describe("Faculty authorized roster CSV export", () => {
  it("exports learner names and rolls without contact fields or fallback contact", () => {
    const csv = facultyRosterCsv([base, { ...base, displayName: null }]);
    expect(csv).toContain('Student,Roll number\r\n');
    expect(csv).toContain('"Asha","R1"');
    expect(csv).toContain('"Learner (name unavailable)"');
    expect(csv).not.toContain(base.email);
    expect(csv).not.toContain(base.phoneE164);
    expect(csv).not.toContain(base.membershipId);
  });
  it("neutralizes formulas including invisible prefixes and escapes quotes", () => {
    const csv = facultyRosterCsv([{ ...base, displayName: '\u200B=HYPERLINK("evil")', rollNumber: '@SUM(1,2)' }]);
    expect(csv).toContain("'\u200B=HYPERLINK");
    expect(csv).toContain('""evil""');
    expect(csv).toContain("'@SUM(1,2)");
  });
  it("caps at 500 learner rows and explicitly reports omitted rows", () => {
    const csv = facultyRosterCsv(Array.from({length: 501}, (_,i) => ({...base, displayName:'Student '+i})));
    expect(csv).toContain('"Student 499"');
    expect(csv).not.toContain('"Student 500"');
    expect(csv).toContain('1 learner rows omitted');
    expect(csv.split('\r\n').filter(Boolean)).toHaveLength(502);
  });
  it("preserves UTF-8 names and creates deterministic filenames", () => {
    expect(facultyRosterCsv([{...base,displayName:"రాము"}])).toContain("రాము");
    expect(facultyRosterCsv([])).toBe("Student,Roll number\r\n");
    expect(facultyRosterFileName("Section A / 2026")).toBe("faculty-roster-section-a-2026.csv");
  });
});
