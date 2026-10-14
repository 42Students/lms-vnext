import { describe, expect, it } from "vitest";
import {
  facultyReportCsv, facultyReportCsvFilename,
  facultyReportCsvSchema, neutralizeFacultyCsvCell,
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
    expect(result).toContain('"Learner","Email","Response","Score","Percent","Submitted at (UTC)","Details"\r\n');
    expect(result).toContain('"రాము","ramu@example.edu","ATTEMPTED","8/10","80"');
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
    expect(result).toContain('"\'+999999999"');
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
  it("creates deterministic safe filenames",() => {
    expect(facultyReportCsvFilename("quiz","Java / \\ Test","Section A"))
      .toBe("faculty-quiz-report-java-test-section-a.csv");
  });
});
