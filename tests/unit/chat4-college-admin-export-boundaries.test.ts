import { describe, expect, it } from "vitest";
import {
  exportParams, buildCollegeDirectoryCsv, collectCollegeExportRows,
} from "@/modules/academics/college-directory-export-model";
import {
  collegeAdminHistoryCsv, MAX_ADMIN_HISTORY_EXPORT_ROWS,
} from "@/modules/colleges/admin-history-export-model";

describe("chat-4 College Admin export boundaries", () => {
  it("COL-export-01 rejects repeated URL search filters rather than silently taking the first tenant filter", () => {
    expect(exportParams(new URLSearchParams("collegeId=one&collegeId=two"))).toBeNull();
    expect(exportParams(new URLSearchParams("q=test&page=2"))).toEqual({ q: "test", page: "2" });
    expect(exportParams(new URLSearchParams("q="))).toEqual({});
  });

  it("COL-export-02 escapes formulas, quotes, delimiters and preserves BOM for office imports", () => {
    const csv=buildCollegeDirectoryCsv(["Name","Note"], [
      ["=HYPERLINK(\"https://hostile.example\")", 'Has "quotes", and a comma'],
      ["  +SUM(1,2)", "safe"],
    ],false,1000);
    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain('"\'=HYPERLINK(""https://hostile.example"")"');
    expect(csv).toContain('"Has ""quotes"", and a comma"');
    expect(csv).toContain('"\'  +SUM(1,2)"');
    expect(csv.split("\r\n")).toHaveLength(3);
  });

  it("COL-export-09 neutralizes Unicode-hidden formulas in College Admin directory exports", () => {
    const values = ["\u200B=1+1", "\u2067+SUM(1)", "\u0301@IMPORTDATA(1)"];
    const csv=buildCollegeDirectoryCsv(["Name"],values.map(value=>[value]),false,100);
    for(const value of values)expect(csv).toContain('"' + "'" + value + '"');
    expect(csv).not.toContain('"\u200B=1+1"');
  });

  it("COL-export-03 marks truncation without claiming that every record is included", () => {
    const csv=buildCollegeDirectoryCsv(["Name"],[["College A"]],true,100);
    expect(csv).toContain("EXPORT TRUNCATED");
    expect(csv).toContain("Only the first 100 matching records were exported.");
  });

  it("COL-export-04 walks bounded paginated rows once and never exceeds the explicit cap", async () => {
    const pages:number[]=[];
    const output=await collectCollegeExportRows(async page=>{
      pages.push(page);
      return {items: Array.from({length:10},(_,i)=>page*10+i),
        total:40,totalPages:4};
    },10,25);
    expect(pages).toEqual([1,2,3]);
    expect(output.rows).toHaveLength(25);
    expect(output.truncated).toBe(true);
    expect(output.cap).toBe(25);
  });

  it("COL-export-05 rejects unsafe internal job page sizes and caps before reading data", async () => {
    let called=0;
    const read=async (_page:number)=>{called+=1;return {items:[1],total:1,totalPages:1};};
    for (const [pageSize,cap] of [[0,100],[-1,100],[1001,100],[1,0],[1,1001],[1,1.5],[1,Infinity]] as const) {
      await expect(collectCollegeExportRows(read,pageSize,cap)).rejects.toThrow(RangeError);
    }
    expect(called).toBe(0);
  });

  it("COL-export-06 formats history using IST and neutralizes spreadsheet commands", () => {
    const csv=collegeAdminHistoryCsv([{occurredAt:new Date("2099-10-18T00:00:00.000Z"),
      eventType:"=NOW()",summary:"@bad"}]);
    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain("When (IST)");
    expect(csv).toContain('"\'=NOW()"');
    expect(csv).toContain('"\'@bad"');
    expect(csv).toContain("18 Oct 2099");
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("COL-export-08 neutralizes invisible prefix and combining-mark formula payloads in history", () => {
    const risky = ["\u200B=1+1", "\u2066@IMPORTDATA(1)", "\u0301+SUM(1)", "\t=BAD"];
    const rows = risky.map(value => ({
      occurredAt: new Date("2099-10-18T00:00:00.000Z"), eventType: value, summary: value,
    }));
    rows.push({
      occurredAt: new Date("2099-10-18T00:00:00.000Z"),
      eventType: "safe", summary: "Just text",
    });
    const csv = collegeAdminHistoryCsv(rows);
    for (const payload of risky) {
      expect(csv).toContain('"' + "'" + payload + '"');
    }
    expect(csv).toContain('"Just text"');
  });

  it("COL-export-07 caps history at 100 rows and visibly reports truncation", () => {
    const rows=Array.from({length:MAX_ADMIN_HISTORY_EXPORT_ROWS+1},(_,i)=>({
      occurredAt:new Date("2099-10-18T00:00:00.000Z"),
      eventType:"HISTORY",summary:"event "+i,
    }));
    const csv=collegeAdminHistoryCsv(rows);
    expect(MAX_ADMIN_HISTORY_EXPORT_ROWS).toBe(100);
    expect(csv).toContain("EXPORT TRUNCATED");
    expect(csv).toContain("Only the first 100 visible administrator history events were exported.");
    expect(csv).toContain("event 99");
    expect(csv).not.toContain("event 100");
  });
});
