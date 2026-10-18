import {describe,expect,it} from "vitest";
import {
  reportTableCsv,reportTableTsv,safeReportCsvCell,
  safeReportTsvCell,safeReportDownloadName,
} from "@/components/placements/report-interactive-table-export-model";

describe("UX-SPILL-HR-01: employer and college report exports are safe for spreadsheet viewers",()=>{
 it.each([
  '=HYPERLINK("https://attacker.invalid")',
  " +SUM(1,2)",
  "\t@SUM(A1:A2)",
  "\uFEFF=1+2",
  "\u200B-1+2",
  "\u00A0=cmd",
  "\r\n@sum",
 ])("escapes attacker-controlled text %j in CSV", input=>{
  const csv=safeReportCsvCell(input);
  expect(csv.startsWith("\"'")).toBe(true);
  expect(csv).toContain(input.replaceAll('"','""'));
 });
 it("preserves genuine numeric negative report totals but neutralizes string-based negatives",()=>{
  expect(safeReportCsvCell(-5000)).toBe('"-5000"');
  expect(safeReportCsvCell("-5000")).toBe('"\'-5000"');
 });
 it("quotes newlines, delimiter commas and doubled quotes without destroying rows",()=>{
  const csv=reportTableCsv(["Company","Applicant","Share"],[
    ["A,B",'John "Doe"',null],
    ["=FORMULA","line 1\nline 2",123],
  ]);
  expect(csv).toBe(
    '"Company","Applicant","Share"\r\n'+
    '"A,B","John ""Doe""",""\r\n'+
    '"\'=FORMULA","line 1\nline 2","123"\r\n',
  );
 });
 it("clipboard output cannot insert a forged row/column or executable formula",()=>{
  expect(safeReportTsvCell("\n=SUM(1,2)\tsecond")).toBe("' =SUM(1,2) second");
  const tsv=reportTableTsv(["Role","Count"],[
    ['=HYPERLINK("example")\tSECRET',5],
    ["Needs\nverification",0],
  ]);
  expect(tsv.split("\n")).toHaveLength(3);
  expect(tsv).not.toContain("\tSECRET\t");
  expect(tsv).toContain("'=HYPERLINK");
 });
 it("uses a bounded safe filename even when report title has only punctuation",()=>{
  expect(safeReportDownloadName("".padEnd(120,"<"))).toBe("report-export.csv");
  expect(safeReportDownloadName("Hiring • Q4 / 2026")).toBe("report-hiring-q4-2026.csv");
  expect(safeReportDownloadName("x".repeat(100)).length).toBeLessThanOrEqual(91);
 });
});
