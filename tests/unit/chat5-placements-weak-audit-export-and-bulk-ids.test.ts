import {describe,expect,it} from "vitest";
import {tpoAuditCsv} from "@/modules/placements/tpo-audit-csv-model";
import {roundApplyPreviewCsv,roundApplyReportCsv} from "@/modules/placements/tpo-round-apply-csv-model";
import {tpoRoundFailureCsv,tpoRoundFailureCsvQuerySchema} from "@/modules/placements/tpo-round-failure-csv-model";
import {tpoIndiaCalendarDay} from "@/modules/placements/tpo-local-date-model";
import {matchTpoStudentRolls,tpoStudentClipboardCell,tpoStudentClipboardTsv} from "@/modules/placements/tpo-student-clipboard-model";
import type {TpoAuditRow} from "@/modules/placements/tpo-audit-service";
import type {TpoStudentRow} from "@/modules/placements/tpo-students-model";
const learner=(id:string,roll:string|null,registration:string|null):TpoStudentRow=>
 ({membershipId:id,rollNumber:roll,registrationNumber:registration}) as unknown as TpoStudentRow;
const A="11111111-1111-4111-8111-111111111111";
const B="22222222-2222-4222-8222-222222222222";
const C="33333333-3333-4333-8333-333333333333";
describe("TPO-AUDIT-CSV-01 TPO export spreadsheet injection hardening",()=>{
 it("neutralizes formulas even with leading whitespace, tabs, CR, hyphen, and quotes",()=>{
  const rows:TpoAuditRow[]=[{
   id:A,kind:"ACTIVITY",eventType:"PLACEMENTS_COLLEGE_RULES_UPDATED",
   title:"  =IMPORTXML(\"https://attacker.example\")",detail:"",
   actorName:"\t+SUM(1,1)",occurredAt:"2099-10-18T18:29:59Z",jobId:null,
  }];
  const csv=tpoAuditCsv(rows);
  expect(csv).toContain("'  =IMPORTXML");
  expect(csv).toContain("'\t+SUM");
  expect(csv).toContain('""https://attacker.example""');
  expect(csv).toContain(" IST");
  expect(csv.split("\r\n")).toHaveLength(3);
 });
 it("bulk result and failure reports must escape formula cell starts, not only normal quotes",()=>{
  const preview=roundApplyPreviewCsv([{student:" =2+3",outcome:"PASS",destination:" +5",status:"STAGED"}]);
  expect(preview).toContain("' =2+3");
  expect(preview).toContain("' +5");
  const report=roundApplyReportCsv([{student:"-5",outcome:"HOLD",status:"SKIPPED",reason:"\"=cmd\""}]);
  expect(report).toContain("'-5");
  expect(report).toContain('""=cmd""');
  const fail=tpoRoundFailureCsv([{roundName:" @SUM(1)",branchName:"Normal",failed:1,decisions:2,shareOfRoundPercent:50}]);
  expect(fail).toContain("' @SUM(1)");
  expect(fail).toContain('"50%"');
  expect(tpoRoundFailureCsvQuerySchema.safeParse({jobId:"../another-tenant"}).success).toBe(false);
 });
 it("TPO-date-01 uses IST boundary when UTC calendar day differs",()=>{
  expect(tpoIndiaCalendarDay(new Date("2026-10-18T18:29:59.999Z"))).toBe("2026-10-18");
  expect(tpoIndiaCalendarDay(new Date("2026-10-18T18:30:00.000Z"))).toBe("2026-10-19");
 });
});
describe("TPO-STUDENTS-BULK-AMBIG-01 avoid guessing learners by duplicate roll number",()=>{
 it("never selects either membership for ambiguous case-folded roll or cross-field duplicate",()=>{
  const rows=[
   learner(A,"CS42","REG-A"),learner(B,"cs42","REG-B"),learner(C,"CS43","REG-A"),
  ];
  expect(matchTpoStudentRolls(rows,"CS42").found).toEqual([]);
  expect(matchTpoStudentRolls(rows,"cs42").missing).toEqual(["cs42"]);
  expect(matchTpoStudentRolls(rows,"REG-A").found).toEqual([]);
  const result=matchTpoStudentRolls(rows,"CS42 CS43 REG-B MISSING");
  expect(result).toEqual({found:[C,B],missing:["CS42","MISSING"],requested:4});
 });
 it("dedupes identical memberships and preserves valid unambiguous case-insensitive lookups",()=>{
  const rows=[learner(A,"CS1","REG1"),learner(A,"CS1","REG1"),learner(B,"CS2",null)];
  const found=matchTpoStudentRolls(rows,"cs1,REG1;CS2,CS2");
  expect(found).toEqual({found:[A,B],missing:[],requested:3});
 });
 it("does not allow pasted tabs/newlines or formulas to escape a TSV cell",()=>{
  expect(tpoStudentClipboardCell(" =2+2\tsecret\r\nnext")).toBe("' =2+2 secret  next");
  expect(tpoStudentClipboardCell(null)).toBe("");
  const fake={...learner(A,"CS1","REG1"),displayName:"-1",programName:"BTech",cohortName:"2026",
   branchName:"CSE",journeyState:"NOT_DECIDED",applicationCount:0,offerCount:0,offersAwaitingAnswer:0,bestSoFar:"none"} as TpoStudentRow;
  const tsv=tpoStudentClipboardTsv([fake]);
  expect(tsv).toContain("'-1");
  expect(tsv).toContain("NOT DECIDED");
 });
});
