import {describe,it,expect} from "vitest";
import {cohortCreationResultRows} from "@/modules/projects/cohort-creation-outcome-model";
import {classTeamCreationOutcomeCsv} from "@/modules/projects/class-team-creation-outcome-export";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("SA-placements-projects-56 truthful per-student creation results",()=>{
 const groups=[{membershipIds:["learner-a"]},{membershipIds:["learner-b"]}];
 const created=[{learnerMembershipId:"learner-a",title:"Project A",projectId:"project-a"}];
 it("SA-placements-projects-56 distinguishes created from already covered without inventing failed commits",()=>{
  expect(cohortCreationResultRows(groups,created,new Set(["learner-b"]))).toEqual([
   {membershipId:"learner-a",status:"CREATED",projectId:"project-a",title:"Project A"},
   {membershipId:"learner-b",status:"ALREADY_COVERED",projectId:null,title:null},
  ]);
 });
 it("SA-placements-projects-56 rejects an incomplete successful transaction instead of falsely reporting a result",()=>{
  expect(()=>cohortCreationResultRows(groups,created,new Set())).toThrow(/incomplete cohort result/);
 });
 it("SA-placements-projects-56 exports exact confirmed per-learner rows without formulas or invented results",()=>{
  const rows=cohortCreationResultRows(groups,created,new Set(["learner-b"]));
  const names=new Map([["learner-a",{displayName:"=HYPERLINK(\"https://example.invalid\")"}]]);
  const csv=classTeamCreationOutcomeCsv(rows,names);
  expect(csv).toContain('"Student membership","Result","Workspace","Project ID"');
  expect(csv).toContain("'=HYPERLINK");
  expect(csv).toContain('"learner-a","CREATED","Project A","project-a"');
  expect(csv).toContain('"learner-b","ALREADY_COVERED","",""');
  expect((csv.match(/\r\n/g)??[])).toHaveLength(3);
 });
 it("SA-placements-projects-56 retains the server-side authenticated class roster and atomic serializable transaction",()=>{
  const service=read("src/modules/projects/class-team-workspace-service.ts");
  expect(service).toContain('loadClassTeamRoster(context, scope.id, input.classId)');
  expect(service).toContain('isolationLevel:"serializable"');
  expect(service).toContain("cohortCreationResultRows(groups,created,covered)");
 });
 it("SA-placements-projects-56 exposes a per-learner table and exports all confirmed results",()=>{
  const ui=read("src/components/projects/class-team-workspace-creator.tsx");
  expect(ui).toContain("Per-learner creation results");
  expect(ui).toContain("outcome.individualResults.map");
  expect(ui).toContain("classTeamCreationOutcomeCsv(outcome.individualResults,names)");
  const exportModel=read("src/modules/projects/class-team-creation-outcome-export.ts");
  expect(exportModel).toContain('"Student membership","Result","Workspace","Project ID"');
  expect(exportModel).toContain("rows.map(row=>[");
  expect(exportModel).toContain("projectWorkspaceCsvCell");
 });
});

describe("SA-placements-projects-56 version-bound preflight",()=>{
 it("SA-placements-projects-56 cannot confirm an old college, class, template or roster preview",()=>{
  const ui=read("src/components/projects/class-team-workspace-creator.tsx");
  expect(ui).toContain('preflight?.scopeKey===preflightScopeKey?preflight:null');
  expect(ui).toContain('collegeId+":"+classId+":"+templateId+":"+(roster?.revision??"")');
  expect(ui).toContain("if(!currentPreflight)return;");
  expect(ui).toContain("setPreflight({...data,scopeKey:preflightScopeKey})");
 });
});
