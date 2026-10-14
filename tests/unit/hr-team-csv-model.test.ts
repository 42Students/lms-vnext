import {describe,expect,it} from "vitest";
import {buildHrTeamCsv,HR_TEAM_CSV_CAP} from "@/modules/placements/hr-team-csv-model";
describe("HR own-company team CSV",()=>{
 const person={displayName:"  =HYPERLINK(1,2)",title:"+HR lead",
  email:"recruiter@company.test",isYou:true};
 it("neutralizes formulas in names and designations",()=>{
  const result=buildHrTeamCsv([person]);
  expect(result.csv).toContain("'  =HYPERLINK");
  expect(result.csv).toContain("'+HR lead");
  expect(result.csv).toContain("recruiter@company.test");
  expect(result.truncated).toBe(false);
 });
 it("caps the export without accepting unrelated company records",()=>{
  const result=buildHrTeamCsv(Array.from({length:HR_TEAM_CSV_CAP+2},()=>person));
  expect(result.exported).toBe(200);
  expect(result.truncated).toBe(true);
  expect(result.csv).toContain("Additional authorized teammates omitted");
 });
});
