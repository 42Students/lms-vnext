import {describe,expect,it} from "vitest";
import {tpoCompanyDirectoryCsv} from "@/modules/placements/tpo-company-directory-export-model";
import {
 tpoStudentClipboardCell,tpoStudentClipboardTsv,matchTpoStudentRolls,
} from "@/modules/placements/tpo-student-clipboard-model";
import {tpoStudentCsvCell} from "@/modules/placements/tpo-students-csv";
import type {TpoStudentRow} from "@/modules/placements/tpo-students-model";
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const row=(id:string,roll:string,number:string):TpoStudentRow=>({
 membershipId:id,displayName:"=HYPERLINK(\"https://evil.invalid\")",rollNumber:roll,registrationNumber:number,
 programName:"B.Tech",cohortName:"2026",branchName:"Computer",journeyState:"APPLYING",
 applicationCount:1,offerCount:0,offersAwaitingAnswer:0,bestSoFar:"Applied",
} as TpoStudentRow);
describe("TPO-BREAK-exports-01 formula-safe company and learner exports",()=>{
 it("guards leading BOM/zero-width formula input, quotes and CRLF without executing imported company text",()=>{
  const name="\u200B=HYPERLINK(\"https://evil.invalid\")";
  const csv=tpoCompanyDirectoryCsv([{
   name,contacts:1,drivesRan:1,acceptedOfferDrives:0,studentsPlaced:null,
   communication:"NEW",people:[{name:"\t+SUM(1,2)"}],
  }]);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain(tpoStudentCsvCell(name));
  expect(csv).toContain(tpoStudentCsvCell("\t+SUM(1,2)"));
  expect(csv).toContain('"Not enough data yet"');
  expect(csv).toContain("\r\n");
  expect(csv).not.toContain(',"=HYPERLINK');
 });
 it("neutralizes formulas with hidden leading characters and removes cell-breaking controls in TSV",()=>{
  for(const value of ["=1+2","+SUM(1,2)","\u200B=HYPERLINK(1)"," \uFEFF@cmd","\t-42"]){
   const safe=tpoStudentClipboardCell(value);
   expect(safe.startsWith("'")).toBe(true);
  }
  expect(tpoStudentClipboardCell("Alpha\tBeta\r\nGamma")).toBe("Alpha Beta  Gamma");
  const data=tpoStudentClipboardTsv([row(A,"CS001","R001")]);
  expect(data).toContain("'=HYPERLINK");
  expect(data.split("\r\n")).toHaveLength(2);
 });
});
describe("TPO-students-export-UNICODE-01 hidden prefix spreadsheet formula safety",()=>{
 it("quotes and neutralizes export cells with bidirectional, word-joiner and combining-mark prefixes",()=>{
  const hidden=["\\u2060=1+1","\\u200C+SUM(1,2)","\\u200D@CMD","\\u202E-42","\\u0301=HYPERLINK(1)","\\u00AD=1+2"];
  for(const source of hidden.map(x=>x.replace(/\\\\u([0-9a-f]{4})/gi,(_whole,hex:string)=>String.fromCharCode(parseInt(hex,16))))){
   expect(tpoStudentCsvCell(source)).toBe(`"'${source}"`);
   expect(tpoStudentClipboardCell(source)).toBe("'"+source);
  }
  expect(tpoStudentCsvCell("Ordinary Student")).toBe('"Ordinary Student"');
  expect(tpoStudentCsvCell("8.4")).toBe('"8.4"');
  expect(tpoStudentClipboardCell("Ordinary Student")).toBe("Ordinary Student");
 });
});

describe("TPO-BREAK-company-route-03 CSV response hardening",()=>{
 it("the actual company CSV route uses the common Unicode-safe cell encoder",async()=>{
  const {readFileSync}=await import("node:fs");
  const {resolve}=await import("node:path");
  const code=readFileSync(resolve(process.cwd(),
   "src/app/api/placements/tpo/companies/export/route.ts"),"utf8");
  expect(code).toContain("tpoStudentCsvCell(String(value??\"\")");
 });
});

describe("TPO-BREAK-roll-selection-02 ambiguous identifiers never select arbitrary learners",()=>{
 it("rejects colliding rolls and registration numbers across distinct members",()=>{
  const matches=matchTpoStudentRolls([
   row(A,"CS001","REG001"),
   row(B,"cs001","REG002"),
  ],"CS001 REG002 outside");
  expect(matches.found).toEqual([B]);
  expect(matches.missing).toEqual(["CS001","outside"]);
  expect(matches.requested).toBe(3);
 });
 it("allows a single learner's own roll/registration equivalence and deduplicates selection",()=>{
  const matches=matchTpoStudentRolls([
   row(A,"CS001","CS001"),
   row(B,"CS002","REG002"),
  ]," cs001,CS001, reg002 ");
  expect(matches.found).toEqual([A,B]);
  expect(matches.missing).toEqual([]);
  expect(matches.requested).toBe(3);
 });
 it("never treats an unrecognized roll as a guessed project membership id",()=>{
  const matches=matchTpoStudentRolls([row(A,"CS001","REG001")],B);
  expect(matches.found).toEqual([]);
  expect(matches.missing).toEqual([B]);
 });
});
