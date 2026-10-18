import {describe,expect,it} from "vitest";
import {projectCompletionPercent} from "@/modules/projects/progress-percentage-policy";
import {summarizeLearnerProjectProgress} from "@/modules/projects/learner-project-progress-model";
import {learnerProjectActivityCsv} from "@/modules/projects/learner-project-activity-csv-model";
import {filterLearnerProjectActivity,learnerProjectActivityFilterSchema,
 learnerProjectActivityDateBounds,learnerProjectActivityPageHref,parseLearnerProjectActivityFilters}
 from "@/modules/projects/learner-project-activity-filter-model";
import {learnerProjectActivityLastFetched} from "@/modules/projects/learner-project-activity-cursor-model";
import {learnerProjectActivityPageSummary} from "@/modules/projects/learner-project-activity-page-summary-model";
import {findOwnLearnerBoardTask,learnerBoardTaskHref} from "@/modules/projects/learner-board-task-detail-model";
import {learnerProjectReadFailureDisposition} from "@/modules/projects/learner-project-detail-error-model";

const id="11111111-1111-4111-8111-111111111111",other="22222222-2222-4222-8222-222222222222";
describe("PROJ-BREAK-LEARNER-02 project data isolation, calculated progress and export resilience",()=>{
 it("never displays invented 100% for unmeasured work or incomplete tasks rounded up",()=>{
  expect(projectCompletionPercent(0,0)).toBeNull();
  expect(projectCompletionPercent(NaN,5)).toBeNull();
  expect(projectCompletionPercent(2,3)).toBe(67);
  expect(projectCompletionPercent(999,3)).toBe(100);
  expect(projectCompletionPercent(0,3)).toBe(0);
  expect(projectCompletionPercent(100,101)).toBe(99);
  const rows=summarizeLearnerProjectProgress([id,other],[
   {projectId:id,status:"DONE"},{projectId:id,status:"BLOCKED"},
   {projectId:id,status:"IN_REVIEW"},{projectId:"foreign",status:"DONE"},
  ]);
  expect(rows).toEqual([
   {projectId:id,totalTasks:3,completedTasks:1,blockedTasks:1,percentage:33},
   {projectId:other,totalTasks:0,completedTasks:0,blockedTasks:0,percentage:null},
  ]);
 });
 it("exports only the already authorized 100 activity rows with per-cell size bound and CSV formula protection",()=>{
  const date=new Date("2026-10-18T04:35:00Z");
  const rows=Array.from({length:101},(_,i)=>({
   occurredAt:date,actorDisplayName:i===0?"=HYPERLINK(\"https://evil\")":null,
   summary:i===0?"+cmd,\nnext": "event "+i,
   subjectLabel:i===0?"@"+"x".repeat(250):null,
  }));
  const csv=learnerProjectActivityCsv(rows);
  expect(csv.truncated).toBe(true);
  expect(csv.content.startsWith("UTC time,Actor,Subject,Summary")).toBe(true);
  expect(csv.content).not.toContain("event 100");
  expect(csv.content).toContain("2026-10-18T04:35:00.000Z");
  expect(csv.content).toContain("'=HYPERLINK");
  expect(csv.content).toContain("'+cmd");
  expect(csv.content).not.toContain("x".repeat(250));
  expect(csv.content.endsWith("\r\n")).toBe(true);
 });
 it("enforces paired activity cursor, exact dates and half-open IST interval to prevent adjacent-day inclusion",()=>{
  const valid={category:"TASK",from:"2026-10-18",to:"2026-10-18"};
  const parsed=learnerProjectActivityFilterSchema.parse(valid);
  const bounds=learnerProjectActivityDateBounds(parsed);
  expect(bounds.from?.toISOString()).toBe("2026-10-17T18:30:00.000Z");
  expect(bounds.until?.toISOString()).toBe("2026-10-18T18:30:00.000Z");
  for(const bad of [
   {...valid,from:"2026-10-19"},{...valid,beforeId:id},
   {...valid,beforeTime:"2026-10-18T04:35:00Z"},
   {...valid,category:"FOREIGN"},{...valid,who:"other-learner"},
  ])expect(learnerProjectActivityFilterSchema.safeParse(bad).success).toBe(false);
  expect(parseLearnerProjectActivityFilters({category:"",from:"",to:""}).success).toBe(true);
 });
 it("filtering category does not include unrelated project/other-tenant events beyond the provided authorized page",()=>{
  const events=[
   {eventType:"projects.task.changed",id:"1"},{eventType:"projects.delivery.submitted",id:"2"},
   {eventType:"projects.mentor.changed",id:"3"},{eventType:"system.secret",id:"4"},
  ];
  expect(filterLearnerProjectActivity(events,"TASK").map(x=>x.id)).toEqual(["1"]);
  expect(filterLearnerProjectActivity(events,"SUBMISSION").map(x=>x.id)).toEqual(["2"]);
  expect(filterLearnerProjectActivity(events,"ALL")).toHaveLength(4);
  expect(filterLearnerProjectActivity(events,"UNKNOWN")).toHaveLength(4);
 });
 it("loads cursor from last fetched authorized row, not last client-filtered row",()=>{
  const rows=[{id:"a",cursorOccurredAt:"2026-10-18T10:00Z"},
   {id:"b",cursorOccurredAt:"2026-10-18T09:00Z"}];
  expect(learnerProjectActivityLastFetched(rows)?.id).toBe("b");
  expect(learnerProjectActivityLastFetched([])).toBeUndefined();
  expect(learnerProjectActivityPageSummary(2,20,true)).toContain("on this loaded page");
  expect(learnerProjectActivityPageSummary(2,20,false)).toContain("20 events");
 });
 it("board lookup never selects an arbitrary or stale task not among scoped tasks",()=>{
  const tasks=[{id,owner:"learner"},{id:other,owner:"teammate"}];
  expect(findOwnLearnerBoardTask(tasks,id)).toBe(tasks[0]);
  expect(findOwnLearnerBoardTask(tasks,"not-a-uuid")).toBeNull();
  expect(findOwnLearnerBoardTask(tasks,"33333333-3333-4333-8333-333333333333")).toBeNull();
  const filters={taskSearch:"",priority:"ALL",sprintId:"",releaseId:""};
  expect(learnerBoardTaskHref(id,filters,other)).toContain("taskId="+other);
  expect(learnerBoardTaskHref(id,filters,"bad-id")).not.toContain("taskId=");
 });
 it("returns indistinguishable Not Found for access denied and missing project, retry for genuine loader failure",()=>{
  for(const code of ["PROJECT_NOT_FOUND","PROJECT_ACCESS_DENIED","COLLEGE_NOT_FOUND"] as const)
   expect(learnerProjectReadFailureDisposition(code)).toBe("NOT_FOUND");
  expect(learnerProjectReadFailureDisposition("PROJECT_TASK_INVALID_STATE")).toBe("RETRY");
 });
});
