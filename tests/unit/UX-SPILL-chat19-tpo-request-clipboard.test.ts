import {describe,expect,it} from "vitest";
import {
 requestRowsTsv,type TpoRequestClipboardRow,
} from "@/components/placements/tpo-request-page-clipboard";

const rows:TpoRequestClipboardRow[]=[{
 id:"first",
 student:"Ananya",
 number:"S-100",
 kind:"Proof of placement",
 company:"Hidden Employer",
 asked:"2026-10-18",
 status:"OPEN",
 decided:"2026-10-19",
},{
 id:"second",
 student:"Bharat",
 number:"S-101",
 kind:"Name correction",
 company:"Another Employer",
 asked:"2026-10-17",
 status:"CLOSED",
 decided:null,
}];

describe("UX-SPILL-TPO-CLIP-01: secure college request clipboard export",()=>{
 it("copies the same allowed columns selected in the on-screen table, not hidden companies/identifiers",()=>{
  const copied=requestRowsTsv(rows,["student","status"]);
  expect(copied).toBe("Student\tStatus\nAnanya\tOPEN\nBharat\tCLOSED");
  expect(copied).not.toMatch(/Hidden Employer|Another Employer|S-10|Proof of placement|first|second/);
 });
 it("retains default all-column legacy clipboard ordering and empty cells",()=>{
  const copied=requestRowsTsv(rows);
  expect(copied.split("\n")).toHaveLength(3);
  expect(copied.split("\n")[0]).toBe(
   "Student\tStudent number\tRequest\tCompany\tAsked\tStatus\tDecided",
  );
  expect(copied).toContain("Ananya\tS-100\tProof of placement\tHidden Employer");
  expect(copied).toContain("Bharat\tS-101\tName correction\tAnother Employer");
  expect(copied.endsWith("CLOSED\t")).toBe(true);
 });
 it("never silently copies all columns when no visible columns are selected",()=>{
  expect(()=>requestRowsTsv(rows,[])).toThrow("At least one request column");
 });
 it.each([
  "=HYPERLINK(\"https://attacker.invalid\")",
  "\uFEFF=HYPERLINK(1)",
  "\u2060@IMPORT(1)",
  "\u200D+SUM(A1)",
  "\u2028=1+2",
  "\u2029-1+2",
  "\t=1+2",
  "\r\n@IMPORT(1)",
 ])("neutralizes untrusted formula %j before pasting into a spreadsheet",input=>{
  const copied=requestRowsTsv([{...rows[0]!,student:input}],["student"]);
  const lines=copied.split("\n");
  expect(lines).toHaveLength(2);
  expect(lines[1]?.startsWith("'")).toBe(true);
  expect(lines[1]).not.toMatch(/^[=+\-@]/);
 });
 it("removes embedded delimiters so a malicious student cannot forge extra spreadsheet rows",()=>{
  const copied=requestRowsTsv([{...rows[0]!,student:"A\tB\nC\u2028D\u2029E"}],["student","company"]);
  expect(copied.split("\n")).toHaveLength(2);
  expect(copied.split("\n")[1]!.split("\t")).toHaveLength(2);
  expect(copied).toContain("A B C D E\tHidden Employer");
 });
});
