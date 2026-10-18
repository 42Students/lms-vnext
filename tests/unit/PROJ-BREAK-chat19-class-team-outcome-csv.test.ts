import {describe,expect,it} from "vitest";
import {
 classTeamCreationOutcomeCsv,type ClassTeamCreationResultRow,
} from "@/modules/projects/class-team-creation-outcome-export";

const learner="11111111-1111-4111-8111-111111111111";
const foreignLearner="22222222-2222-4222-8222-222222222222";
const project="33333333-3333-4333-8333-333333333333";
const row:ClassTeamCreationResultRow={
 membershipId:learner,status:"CREATED",title:"Authorized workspace",projectId:project,
};

describe("PROJ-BREAK-OUTCOME-CSV-03: IIT Dharwad per-learner creation export",()=>{
 it.each([
  "\u034F=HYPERLINK(1)",
  "\uFEFF+SUM(A1)",
  "\u2060@IMPORT(1)",
  "\u2028-CMD(1)",
 ])("neutralizes malicious learner name %j",displayName=>{
  const csv=classTeamCreationOutcomeCsv([row],new Map([[learner,{displayName}]]));
  expect(csv).toContain("\"'"+displayName+"\"");
  expect(csv).toContain('"'+project+'"');
 });
 it("neutralizes unsafe workspace title and doubles CSV quotes, commas and linebreaks",()=>{
  const csv=classTeamCreationOutcomeCsv([{
   ...row,title:'=HYPERLINK("https://malicious.invalid", "Open")\nSecond row',
  }],new Map([[learner,{displayName:'Student "A", final'}]]));
  expect(csv).toContain('"Student ""A"", final"');
  expect(csv).toContain('"\'=HYPERLINK(""https://malicious.invalid"", ""Open"")\nSecond row"');
  expect(csv.split("\r\n")).toHaveLength(3);
 });
 it("exports only authorized service-returned results without searching additional rosters",()=>{
  const names=new Map([
   [learner,{displayName:"Authorized learner"}],
   [foreignLearner,{displayName:"Foreign-college learner secret"}],
  ]);
  const csv=classTeamCreationOutcomeCsv([row],names);
  expect(csv).toContain('"Authorized learner"');
  expect(csv).toContain('"CREATED"');
  expect(csv).not.toContain(foreignLearner);
  expect(csv).not.toContain("Foreign-college learner secret");
  expect(csv).toContain('"Learner","Student membership","Result","Workspace","Project ID"');
 });
 it("uses a safe empty name and title for missing roster display or already covered workspaces",()=>{
  const csv=classTeamCreationOutcomeCsv([{
   membershipId:learner,status:"ALREADY_COVERED",projectId:null,title:null,
  }],new Map());
  expect(csv).toContain('""');
  expect(csv).toContain('"ALREADY_COVERED"');
  expect(csv.split("\r\n")).toHaveLength(3);
 });
 it("never adds a row when the authorized service returned no individual results",()=>{
  const csv=classTeamCreationOutcomeCsv([],new Map([[foreignLearner,{displayName:"Hidden"}]]));
  expect(csv).toBe('"Learner","Student membership","Result","Workspace","Project ID"\r\n');
  expect(csv).not.toContain("Hidden");
 });
});
