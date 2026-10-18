import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {
 collegeProjectSummaryPatch,collegeProjectStatusChangeAllowed,
 collegeProjectSummaryMatchesCurrent,
} from "@/modules/projects/college-project-summary-model";

const uuid="11111111-1111-4111-8111-111111111111";
const valid={
 title:"Prototype",summary:"Working",status:"ACTIVE" as const,progressPercent:50,
 phase:null,dueLabel:null,courseLabel:null,sectionId:uuid,
 blocker:null,nextAction:null,startDate:"2099-01-01",endDate:"2099-03-01",
 sprintLengthWeeks:2,estimationUnit:"POINTS" as const,
 expectedTitle:"Prototype",expectedSummary:"Working",
 expectedStatus:"ACTIVE" as const,expectedUpdatedAt:"2099-01-01T00:00:00.000Z",
};
describe("IIT Dharwad chat-11 College Admin Projects hardening",()=>{
 it("PROJ-COL-STATE-01 enumerates allowed and forbidden Project lifecycle transitions",()=>{
  const states=["PLANNED","ACTIVE","COMPLETED","ARCHIVED","UNKNOWN"];
  const scenarios=[
   ["PLANNED","ACTIVE",true,false],
   ["ACTIVE","COMPLETED",false,true],
  ] as const;
  for(const from of states)for(const to of states){
   for(const hasMentor of [false,true])for(const hasApprovedDelivery of [false,true]){
    const permitted=from!=="ARCHIVED"&&to!=="ARCHIVED"&&
     (from===to&&["PLANNED","ACTIVE","COMPLETED"].includes(from)||
      scenarios.some(([f,t,m,d])=>from===f&&to===t&&(m?hasMentor:true)&&(d?hasApprovedDelivery:true)));
    expect(collegeProjectStatusChangeAllowed(from,to,hasMentor,hasApprovedDelivery))
     .toBe(permitted);
   }
  }
 });
 it("PROJ-COL-STATE-02 refuses invalid progress, reversed dates and caller-controlled historical statuses",()=>{
  expect(collegeProjectSummaryPatch.safeParse(valid).success).toBe(true);
  for(const bad of [
   {...valid,progressPercent:101},
   {...valid,progressPercent:-1},
   {...valid,progressPercent:1.5},
   {...valid,startDate:"2099-03-02",endDate:"2099-03-01"},
   {...valid,sectionId:"other-college"},
   {...valid,status:"ARCHIVED"},
   {...valid,extraTenant:"foreign"},
  ])expect(collegeProjectSummaryPatch.safeParse(bad).success).toBe(false);
 });
 it("PROJ-COL-STATE-03 full equality prevents idempotent partial updates from bypassing CAS",()=>{
  const state=Object.fromEntries(Object.entries(valid).filter(([name])=>!name.startsWith("expected")));
  expect(collegeProjectSummaryMatchesCurrent(state,state)).toBe(true);
  for(const key of ["title","summary","status","progressPercent","sectionId","blocker","nextAction","startDate","endDate"]){
   const changed={...state,[key]:key==="progressPercent"?65:"different"};
   expect(collegeProjectSummaryMatchesCurrent(state,changed),key).toBe(false);
  }
 });
 it("PROJ-COL-HIERARCHY-04 requires active section, cohort, program and department in college-scoped transactional summary write",()=>{
  const service=readFileSync("src/modules/projects/college-project-summary-service.ts","utf8");
  const verify=service.slice(service.indexOf("if(input.sectionId){"),service.indexOf("const [updated]=",service.indexOf("if(input.sectionId){")));
  for(const contract of [
   "eq(departments.collegeId,scope.collegeId)",
   "isNull(departments.archivedAt)",
   'eq(programs.status,"ACTIVE")',
   'ne(cohorts.status,"ARCHIVED")',
   'eq(sections.status,"ACTIVE")',
   "PROJECT_ACCESS_DENIED",
  ])expect(verify).toContain(contract);
  expect(service).toContain('assertPersistedPlatformPermission(tx,context,"projects.manage"');
  expect(service).toContain('row.status==="ARCHIVED"');
  expect(service).toContain("collegeProjectSummaryMatchesCurrent(row,input)");
  expect(service).toContain("notifyActiveProjectMembers");
 });
});
