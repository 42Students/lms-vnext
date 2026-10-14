import { describe, expect, it } from "vitest";
import {
  facultyReportCsv, facultyReportCsvFilename,
  facultyReportCsvSchema, neutralizeFacultyCsvCell,
  capFacultyReportCsvRows,facultyCsvIstTimestamp,facultyCsvLearnerLabel,
} from "@/modules/courses/faculty-report-csv";

const basic = {
  kind: "quiz" as const,
  title: "Java Quiz", sectionName: "A",
  rows: [{
    name:"రాము",email:"ramu@example.edu",
    status:"ATTEMPTED" as const,score:"8/10",percent:80,
    submittedAt:"2026-10-14T09:00:00.000Z",note:"Attempt 1",
  }],
};
describe("Faculty authorized assessment CSV",() => {
  it("serializes exact authorized rows with stable fields and UTF-8",() => {
    const result=facultyReportCsv(basic);
    expect(result).toContain('"Learner","Response","Score","Percent","Submitted at (IST)","Details"\r\n');
    expect(result).toContain('"రాము","ATTEMPTED","8/10","80"');
    expect(result.split("\r\n").filter(Boolean)).toHaveLength(2);
    expect(facultyReportCsv({...basic,rows:[]})).not.toContain("ramu@example.edu");
  });
  it("neutralizes formulas after whitespace, BOM, plus signs and hidden characters",() => {
    for(const dangerous of [
      "=1+1","+919876543210","-2+5","@SUM(1,1)",
      "  =HYPERLINK(\"https://evil.example\")",
      "\t@SUM(1,1)","\uFEFF=NOW()","\u200B+42",
    ]) {
      expect(neutralizeFacultyCsvCell(dangerous)).toBe("'"+dangerous);
    }
    const result=facultyReportCsv({...basic,rows:[{
      ...basic.rows[0],
      name:"  =HYPERLINK(\"https://evil.example\")",
      email:"+999999999",
      note:"@IMPORTXML(1,2)",
    }]});
    expect(result).toContain('"\'  =HYPERLINK(""https://evil.example"")"');
    expect(result).not.toContain("+999999999");
    expect(result).toContain('"\'@IMPORTXML(1,2)"');
  });
  it("escapes literal double quotes, commas and newlines",() => {
    const result=facultyReportCsv({...basic,rows:[{
      ...basic.rows[0],name:'Jane, "J"',note:"Row 1\nRow 2",
    }]});
    expect(result).toContain('"Jane, ""J"""');
    expect(result).toContain('"Row 1\nRow 2"');
  });
  it("strictly rejects untrusted fields, invalid kinds and percentages",() => {
    expect(facultyReportCsvSchema.safeParse({...basic,collegeId:"foreign"}).success).toBe(false);
    expect(facultyReportCsvSchema.safeParse({...basic,kind:"custom"}).success).toBe(false);
    expect(facultyReportCsvSchema.safeParse({...basic,rows:[{...basic.rows[0],percent:120}]}).success).toBe(false);
  });
  it("drops contact exports and converts timestamp rollover into IST",()=>{
    const text=facultyReportCsv(basic);
    expect(text).not.toContain("ramu@example.edu");
    expect(text).not.toContain('"Email"');
    expect(text).toContain("2026-10-14 14:30:00 IST");
    expect(facultyCsvIstTimestamp("2026-12-31T20:00:00.000Z"))
      .toBe("2027-01-01 01:30:00 IST");
  });
  it("caps both export kinds without reintroducing formulas or email",()=>{
    const rows=Array.from({length:620},(_,i)=>({...basic.rows[0],
      name:i===0?"=HYPERLINK(1)":"Learner "+i,email:"secret"+i+"@example.edu"}));
    const bounded=capFacultyReportCsvRows(rows);
    expect(bounded.rows).toHaveLength(500);
    expect(bounded.omittedRows).toBe(120);
    const text=facultyReportCsv({...basic,rows:bounded.rows});
    expect(text).toContain("HYPERLINK(1)");
    expect(text).not.toContain("secret0@example.edu");
    expect(text).not.toContain("Learner 501");
  });
  it("never substitutes contact fields for missing learner names", () => {
    expect(facultyCsvLearnerLabel(null)).toBe("Learner (name unavailable)");
    expect(facultyCsvLearnerLabel("  ")).toBe("Learner (name unavailable)");
    expect(facultyCsvLearnerLabel("  Asha  ")).toBe("Asha");
  });
  it("creates deterministic safe filenames",() => {
    expect(facultyReportCsvFilename("quiz","Java / \\ Test","Section A"))
      .toBe("faculty-quiz-report-java-test-section-a.csv");
  });
});
