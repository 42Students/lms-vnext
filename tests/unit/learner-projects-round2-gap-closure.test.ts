import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
import {learnerSprintRollup,learnerSprintProgress} from "@/modules/projects/learner-sprint-progress-model";
import {learnerProjectActivityEmptyMessage} from "@/modules/projects/learner-project-activity-empty-model";

const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const workspace=()=>source("src/components/projects/project-workspace.tsx");
describe("learner/projects round-two gap verification",()=>{
 it("LEARNER-projects-04 supports legacy Active In progress Ready and Blocked status choices",()=>{
  const list=source("src/components/projects/project-participant-list-controls.tsx");
  const page=source("src/app/(authenticated)/learn/projects/page.tsx");
  for(const status of ["ACTIVE","IN_PROGRESS","READY","BLOCKED"])
   expect(list).toContain(status);
  for(const phrase of ['query.status==="IN_PROGRESS"','query.status==="READY"',
   'query.status==="BLOCKED"'])expect(page).toContain(phrase);
 });
 it("LEARNER-projects-06 shows legacy loading failure Retry and both empty messages",()=>{
  expect(source("src/app/(authenticated)/learn/projects/error.tsx")).toContain("Projects could not be loaded");
  expect(source("src/app/(authenticated)/learn/projects/error.tsx")).toContain("Check your connection, then try again.");
  expect(source("src/app/(authenticated)/learn/projects/loading.tsx")).toContain("Refreshing projects…");
  expect(source("src/modules/projects/learner-project-list-empty-model.ts")).toContain("No projects assigned yet.");
  expect(source("src/modules/projects/learner-project-list-empty-model.ts")).toContain("No projects match these filters.");
 });
 it("LEARNER-projects-09 retains Projects as the list heading and the real workspace title",()=>{
  const listPage=source("src/app/(authenticated)/learn/projects/page.tsx");
  expect(listPage).toContain('<PageHeader title="Projects" description="Choose a project to open its workspace." />');
  const s=workspace();
  expect(s).toContain('title={workspace.project.title}');
  expect(s).toContain('workspace.project.summary ?? undefined');
 });
 it("LEARNER-projects-14 displays task donut lane counts empty state and signoff note",()=>{
  const s=workspace();expect(s).toContain('aria-label="Task completion donut"');
  expect(s).toContain("No tasks on the board yet. Add your first task");
  expect(s).toContain('aria-label="Task lane progress"');
  expect(s).toContain("Submission also needs all");
 });
 it("LEARNER-projects-15 shows ready waiting submitted and accepted final delivery states",()=>{
  const s=workspace();for(const phrase of ["Ready for review","Waiting for completion","Submitted",
    "Mentor left feedback (","What’s left:"])expect(s).toContain(phrase);
 });
 it("LEARNER-projects-20 includes Upcoming meetings and recent history and meeting history",()=>{
  const s=workspace();expect(s).toContain("Upcoming meetings and recent history.");
  expect(s).toContain("Meeting history");
  expect(s).toContain("No meetings yet.");
 });
 it("LEARNER-projects-21 shows project team role explanation and roster count",()=>{
  const s=workspace();expect(s).toContain('"Project team"');
  expect(s).toContain("See who is assigned, what role they play, and how the project is staffed.");
  expect(s).toContain("member(s)");
 });
 it("LEARNER-projects-34 distinguishes no resource, malformed address and popup failures",()=>{
  const s=source("src/components/projects/project-resource-open-link.tsx");
  expect(s).toContain("This resource has no link or file attached yet.");
  expect(s).toContain("This resource has an invalid address.");
  expect(s).toContain("Your browser blocked the resource window.");
  expect(s).toContain("safeProjectExternalHref");
  expect(workspace()).toContain('aria-label="Resource counts"');
 });
 it("LEARNER-projects-35 uses exact empty activity text and friendly retry state",()=>{
  expect(learnerProjectActivityEmptyMessage({valid:true,fetchedCount:0,
    pageCount:0,searching:false,filtered:false,olderPage:false,hasMore:false}))
    .toBe("No project activity yet. Task moves, sprint updates and resource changes will appear here.");
  const s=source("src/components/projects/learner-project-activity.tsx");
  expect(s).toContain("From (IST)");expect(s).toContain("Through (IST)");
 });
 it("LEARNER-projects-R04 calculates sprint overdue and per-sprint task completion safely",()=>{
  const sprints=[{id:"a",status:"ACTIVE",dueDate:"2099-04-01"},
    {id:"b",status:"COMPLETED",dueDate:"2099-02-10"},
    {id:"c",status:"PLANNED",dueDate:null}];
  expect(learnerSprintRollup(sprints,[],"2099-04-02"))
    .toEqual({total:3,completed:1,overdue:1});
  expect(learnerSprintProgress(sprints[0],[{sprintId:"a",status:"DONE"},
    {sprintId:"a",status:"TODO"}]).percentage).toBe(50);
  expect(learnerSprintProgress(sprints[2],[]).percentage).toBe(0);
  expect(learnerSprintProgress(sprints[1],[]).percentage).toBe(100);
  expect(workspace()).toContain("Sprints completed");
 });
});
