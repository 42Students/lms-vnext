import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 collegeProjectSummaryPatch,collegeProjectStatusChangeAllowed,
 collegeProjectSummaryMatchesCurrent,
} from "@/modules/projects/college-project-summary-model";

const id="11111111-1111-4111-8111-111111111111";
const current={
 title:"Project Alpha",summary:"Original",status:"PLANNED",
 progressPercent:0,phase:null,dueLabel:null,courseLabel:null,sectionId:null,
 blocker:null,nextAction:null,startDate:"2026-10-17",endDate:"2026-10-18",
 sprintLengthWeeks:2,estimationUnit:"POINTS",
} as const;
const patch={
 ...current,expectedTitle:current.title,expectedSummary:current.summary,
 expectedStatus:current.status,expectedUpdatedAt:"2026-10-18T12:34:56.123+05:30",
};
const source=(path:string)=>readFileSync(path,"utf8");

describe("PROJ-BREAK-COL-SUMMARY-01 College Admin project editing",()=>{
 it("rejects malformed title, statuses, progress, dates, stale token and foreign extra fields",()=>{
  expect(collegeProjectSummaryPatch.safeParse(patch).success).toBe(true);
  const bad=[
   {title:" "},{title:"x".repeat(201)},{status:"ARCHIVED"},
   {progressPercent:-1},{progressPercent:101},{progressPercent:1.5},
   {phase:"x".repeat(121)},{endDate:"2026-10-16"},
   {startDate:"2026-02-30"},{endDate:"2026-10-18T00:00:00Z"},
   {sprintLengthWeeks:0},{sprintLengthWeeks:105},{sprintLengthWeeks:1.1},
   {estimationUnit:"MINUTES"},{sectionId:"another-college"},
   {expectedUpdatedAt:"yesterday"},{expectedUpdatedAt:"2026-10-18"},
   {expectedStatus:"ARCHIVED"},{expectedTitle:9},{organizationId:id},
  ];
  for(const override of bad){
   const result=collegeProjectSummaryPatch.safeParse({...patch,...override});
   expect(result.success,JSON.stringify(override)).toBe(false);
  }
 });
 it("permits only PLANNED→ACTIVE with mentor and ACTIVE→COMPLETED with approved delivery",()=>{
  const statuses=["PLANNED","ACTIVE","COMPLETED","ARCHIVED","UNRECOGNIZED"];
  for(const from of statuses)for(const to of statuses)for(const mentor of [false,true])for(const delivery of [false,true]){
   const expected=from!=="ARCHIVED"&&from!=="UNRECOGNIZED" &&
    to!=="ARCHIVED"&&to!=="UNRECOGNIZED" &&
    (from===to || from==="PLANNED"&&to==="ACTIVE"&&mentor ||
      from==="ACTIVE"&&to==="COMPLETED"&&delivery);
   expect(collegeProjectStatusChangeAllowed(from,to,mentor,delivery),
    [from,to,mentor,delivery].join(":")).toBe(expected);
  }
 });
 it("makes a repeated exact-state update a no-op, but not an actual status, date or progress mutation",()=>{
  expect(collegeProjectSummaryMatchesCurrent(current,{...current})).toBe(true);
  for(const change of [
   {title:"New"},{summary:"New"},{status:"ACTIVE"},
   {progressPercent:1},{startDate:"2026-10-16"},
   {endDate:null},{estimationUnit:"HOURS"},{sprintLengthWeeks:3},
   {blocker:"Waiting"},{sectionId:id},
  ]){
   expect(collegeProjectSummaryMatchesCurrent(current,{...current,...change}),
    JSON.stringify(change)).toBe(false);
  }
 });
 it("locks and rechecks the persisted college before CAS, writes audit and sends after transaction event",()=>{
  const service=source("src/modules/projects/college-project-summary-service.ts");
  expect(service).toContain("requireProjectManageAccess(context,projectId)");
  expect(service).toContain("eq(projectInstances.collegeId,scope.collegeId)");
  expect(service).toContain('.for("update")');
  const archived=service.indexOf('row.status==="ARCHIVED"');
  const retry=service.indexOf("collegeProjectSummaryMatchesCurrent(row,input)");
  const stale=service.indexOf("PROJECT_SUBMISSION_CONFLICT");
  expect(archived).toBeLessThan(retry);
  expect(retry).toBeLessThan(stale);
  expect(service).toContain("collegeProjectStatusChangeAllowed(row.status,input.status");
  expect(service).toContain("eq(departments.collegeId,scope.collegeId)");
  expect(service).toContain("recordActivityEventInTransaction(tx,context");
  expect(service).toContain("notifyActiveProjectMembers(tx,updatedEvent.id");
 });
});
