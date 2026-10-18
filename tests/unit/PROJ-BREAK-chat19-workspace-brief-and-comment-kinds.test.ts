import {describe,expect,it} from "vitest";
import {
 workspaceBriefSchema,updateWorkspaceBriefSchema,
 parseWorkspaceBrief,emptyWorkspaceBrief,
} from "@/modules/projects/workspace-brief-model";
import {
 PROJECT_TASK_COMMENT_KINDS,PROJECT_TASK_COMMENT_KIND_LABELS,
 projectTaskCommentKindLabel,
} from "@/modules/projects/task-comment-kind-staged";

const good=()=>({
 goal:"Build an accessible delivery",
 description:"IIT Dharwad project acceptance criteria",
 deliverables:["API and screen"],
 completionConditions:["All authorized users can complete the flow"],
 personas:["Learner","Mentor"],
});
describe("PROJ-BREAK-BRIEF-01: workspace brief and persisted task-kind integrity",()=>{
 it("accepts a strict valid brief and a CAS update token with timezone",()=>{
  expect(workspaceBriefSchema.parse(good())).toEqual(good());
  expect(updateWorkspaceBriefSchema.safeParse({
   brief:good(),expectedUpdatedAt:"2026-10-18T15:00:00+05:30",
  }).success).toBe(true);
 });
 it.each([
  {unexpected:"college-a"},
  {goal:"x".repeat(2001)},
  {description:"x".repeat(4001)},
  {deliverables:[""]},
  {completionConditions:[" x ".repeat(200)]},
  {personas:Array.from({length:51},()=>"learner")},
  {goal:7},
 ])("rejects invalid or oversized stored/mutated brief %j",patch=>{
  expect(workspaceBriefSchema.safeParse({...good(),...patch}).success).toBe(false);
 });
 it.each([
  "not-a-version",
  "2026-10-18",
  "2026-10-18T15:00:00",
  "",
 ])("denies malformed or offsetless optimistic token %j",expectedUpdatedAt=>{
  expect(updateWorkspaceBriefSchema.safeParse({
   brief:good(),expectedUpdatedAt,
  }).success).toBe(false);
 });
 it("untrusted invalid persisted JSON is replaced by fresh independent empty lists",()=>{
  const first=parseWorkspaceBrief({collegeId:"other",goal:"Injected"});
  const second=parseWorkspaceBrief({secret:"ignored"});
  expect(first).toEqual(emptyWorkspaceBrief);
  expect(second).toEqual(emptyWorkspaceBrief);
  expect(first).not.toBe(second);
  expect(first.deliverables).not.toBe(second.deliverables);
  first.deliverables.push("first tenant only");
  expect(second.deliverables).toEqual([]);
  expect(emptyWorkspaceBrief.deliverables).toEqual([]);
 });
 it("known comment taxonomy is stable; no message-text inference or forged kinds",()=>{
  expect(PROJECT_TASK_COMMENT_KINDS).toEqual([
   "NOTE","PROGRESS_UPDATE","FLAG_FOR_MENTOR",
  ]);
  for(const kind of PROJECT_TASK_COMMENT_KINDS){
   expect(projectTaskCommentKindLabel(kind)).toBe(PROJECT_TASK_COMMENT_KIND_LABELS[kind]);
  }
  expect(Object.keys(PROJECT_TASK_COMMENT_KIND_LABELS).sort())
   .toEqual([...PROJECT_TASK_COMMENT_KINDS].sort());
  expect(PROJECT_TASK_COMMENT_KINDS.includes("ADMIN" as never)).toBe(false);
 });
});
