import {describe,expect,it} from "vitest";
import {csvSafeCell,mentorBoardReview,mentorBoardReviewHref,mentorBoardReviewQuerySchema,mentorBoardExportCsv,mentorSprintSummaryCsv} from "@/modules/projects/mentor-board-review-model";
const projectId="11111111-1111-4111-8111-111111111111";
const sprintA="22222222-2222-4222-8222-222222222222";
const sprintB="33333333-3333-4333-8333-333333333333";
const sprints=[{id:sprintB,title:"Beta",sequence:2},{id:sprintA,title:"Alpha",sequence:1}];
const tasks=[
 {id:"t4",sprintId:sprintB,title:"Compile backend",priority:"HIGH",status:"DONE",sequence:1},
 {id:"t2",sprintId:sprintA,title:"Add review gate",priority:"CRITICAL",status:"IN_REVIEW",sequence:2},
 {id:"t1",sprintId:sprintA,title:"Write tests",priority:"HIGH",status:"BLOCKED",sequence:1},
 {id:"t3",sprintId:null,title:"Unassigned",priority:"LOW",status:"TODO",sequence:0},
];
const q=(input:Record<string,unknown>={})=>mentorBoardReviewQuerySchema.parse({projectId,...input});

describe("PROJ-BREAK-MENTOR board review behavioural and export boundaries",()=>{
 it("PROJ-BREAK-MENTOR-27 board summary counts persisted task states and stable sprint order",()=>{
  const data=mentorBoardReview(tasks,sprints,q());
  expect(data.count).toBe(4);
  expect(data.total).toBe(4);
  expect(data.totals).toMatchObject({TODO:1,BLOCKED:1,IN_REVIEW:1,DONE:1,IN_PROGRESS:0});
  expect(data.completedPercent).toBe(25);
  expect(data.items.map(row=>row.id)).toEqual(["t1","t2","t4","t3"]);
  expect(data.sprintSummaries.find(row=>row.id===sprintA))
   .toMatchObject({registeredTasks:2,matchingTasks:2,done:0,blocked:1,awaitingReview:1,matchingDonePercent:0});
  expect(mentorBoardReview([],sprints,q()).completedPercent).toBeNull();
  expect(mentorBoardReview([],sprints,q()).sprintSummaries[0].matchingDonePercent).toBeNull();
 });
 it("PROJ-BREAK-MENTOR-28 filter semantics do not inflate or replace stored totals",()=>{
  const blocked=mentorBoardReview(tasks,sprints,q({status:"BLOCKED",priority:"HIGH"}));
  expect(blocked.total).toBe(1);
  expect(blocked.count).toBe(4);
  expect(blocked.completedPercent).toBe(25);
  expect(blocked.items.map(row=>row.id)).toEqual(["t1"]);
  expect(blocked.sprintSummaries.find(row=>row.id===sprintA))
   .toMatchObject({registeredTasks:2,matchingTasks:1,blocked:1});
  expect(mentorBoardReview(tasks,sprints,q({search:"beTa"})).items.map(row=>row.id))
   .toEqual(["t4"]);
  expect(mentorBoardReview(tasks,sprints,q({sprintId:sprintA})).items.map(row=>row.id))
   .toEqual(["t1","t2"]);
  expect(mentorBoardReview(tasks,sprints,q({search:"absent"})).items).toEqual([]);
  for(const hostile of [{actorId:"another"},{projectId:"someone"},{page:0},{page:10001},
    {status:"APPROVED"},{priority:"ADMIN"},{sprintId:"../../"}]){
   expect(mentorBoardReviewQuerySchema.safeParse({projectId,...hostile}).success).toBe(false);
  }
 });
 it("PROJ-BREAK-MENTOR-29 task export caps 500, preserves CSV columns, neutralizes formulas and marks omitted",()=>{
  expect(csvSafeCell("=SUM(1,2)")).toContain("'=SUM");
  expect(csvSafeCell("+HYPERLINK")).toContain("'+HYPERLINK");
  expect(csvSafeCell("normal\",quoted")).toContain('""');
  const rows=Array.from({length:503},(_,i)=>({
   id:"task-"+i,title:i===0?"=CMD()":"Task",status:"DONE",priority:"LOW",sprintTitle:"Alpha",
  }));
  const csv=mentorBoardExportCsv(rows,9);
  expect(csv.replace(/^\uFEFF/,"").trim().split("\r\n")).toHaveLength(502);
  expect(csv).toContain("12 additional matching tasks");
  expect(csv).toContain("'=CMD()");
  expect(csv).not.toContain("task-502");
  expect(csv).not.toContain("learnerEmail");
  expect(mentorBoardExportCsv([],Number.NaN)).not.toContain("Export truncated");
 });
 it("PROJ-BREAK-MENTOR-30 sprint summary export caps 100 and shows unknown empty completion",()=>{
  const rows=Array.from({length:103},(_,i)=>({
   id:"sprint-"+i,title:i===0?"+CMD()":"Sprint",registeredTasks:0,matchingTasks:0,
   done:0,blocked:0,awaitingReview:0,matchingDonePercent:null,
  }));
  const csv=mentorSprintSummaryCsv(rows,5);
  expect(csv.replace(/^\uFEFF/,"").trim().split("\r\n")).toHaveLength(102);
  expect(csv).toContain("8 additional matching Sprints");
  expect(csv).toContain("Unknown");
  expect(csv).toContain("'+CMD()");
  expect(csv).not.toContain("sprint-102");
  expect(mentorSprintSummaryCsv([],Number.NaN)).not.toContain("Export truncated");
 });
 it("PROJ-BREAK-MENTOR-31 board href preserves only allowlisted scoped filters",()=>{
  const href=mentorBoardReviewHref(q({status:"IN_REVIEW",priority:"HIGH",search:"sprint",page:2}));
  expect(href).toContain("/mentor/projects/"+projectId+"/board-review?");
  expect(href).toContain("status=IN_REVIEW");
  expect(href).toContain("priority=HIGH");
  expect(href).toContain("page=2");
  expect(href).not.toMatch(/(?:actor|collegeId|organizationId|tenant)=/);
 });
});
