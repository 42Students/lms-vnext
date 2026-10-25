import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 filterLearnerBoardTasks,learnerBoardEmptyState,learnerBoardActiveFilterCount,
} from "@/modules/projects/learner-project-board-model";
import {sortLearnerBoardTasks} from "@/modules/projects/learner-board-sort-model";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const learner="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const release="33333333-3333-4333-8333-333333333333";
const sprint="44444444-4444-4444-8444-444444444444";
const tasks=[
 {id:"task-b",title:"Build UI",description:"Learner board",priority:"HIGH",status:"TODO",
  sprintId:sprint,assigneeMembershipId:learner,updatedAt:new Date("2099-02-01T00:00:00Z")},
 {id:"task-a",title:"Review API",description:"Service",priority:"LOW",status:"BLOCKED",
  sprintId:sprint,assigneeMembershipId:other,updatedAt:new Date("2099-01-01T00:00:00Z")},
];
describe("PROJ-BREAK-LEARNER-96/97 board filter and mobile navigation resilience",()=>{
 it("filters only the current learner's tasks without mutating the authorized workspace",()=>{
  const selected=filterLearnerBoardTasks(tasks,"build",{mineMembershipId:learner,
   priority:"HIGH",status:"TODO",sprintId:sprint,releaseId:release,
   sprintReleaseById:new Map([[sprint,release]])});
  expect(selected.map(x=>x.id)).toEqual(["task-b"]);
  expect(tasks.map(x=>x.id)).toEqual(["task-b","task-a"]);
  expect(filterLearnerBoardTasks(tasks,"",{
   mineMembershipId:other,priority:"HIGH"})).toEqual([]);
 });
 it("keeps empty workspace distinct from unmatched filters, with predictable stable sorting",()=>{
  expect(learnerBoardEmptyState(0,0)).toBe("NO_TASKS");
  expect(learnerBoardEmptyState(2,0)).toBe("FILTERED_EMPTY");
  expect(learnerBoardEmptyState(2,1)).toBe("RESULTS");
  expect(sortLearnerBoardTasks(tasks,"TITLE").map(x=>x.id)).toEqual(["task-b","task-a"]);
  expect(sortLearnerBoardTasks(tasks,"PRIORITY").map(x=>x.id)).toEqual(["task-b","task-a"]);
  expect(learnerBoardActiveFilterCount({search:"test",priority:"HIGH",
   status:"TODO",sprintId:sprint,releaseId:release,mine:true,taskSort:"PRIORITY"})).toBe(7);
 });
 it("validates hostile query filters only after scoped project read, then renders actionable recovery",()=>{
  const page=read("src/app/(authenticated)/learn/projects/[projectId]/page.tsx");
  const grant=page.indexOf("const access = await requireProjectReadAccess(");
  const reject=page.indexOf("if (invalidBoardFilters)");
  const workspace=page.indexOf("const workspace = await getProjectWorkspaceView(");
  expect(grant).toBeGreaterThan(-1);
  expect(reject).toBeGreaterThan(grant);
  expect(workspace).toBeGreaterThan(reject);
  for(const validation of [
   "!learnerBoardPrioritySchema.safeParse(priorityInput).success",
   "!learnerBoardStatusSchema.safeParse(effectiveTaskStatus).success",
   "!learnerBoardSortSchema.safeParse(taskSortInput).success",
   "!learnerBoardSprintSchema.safeParse(sprintInput).success",
   "!learnerBoardReleaseSchema.safeParse(releaseInput).success",
   "Invalid Board filters","Clear filters",
  ])expect(page).toContain(validation);
 });
 it("preserves keyboard and touch access when Board lanes overflow a 320px device",()=>{
  const board=read("src/components/projects/learner-board-interactive.tsx");
  expect(board).toContain('aria-label="Project Board lanes, scroll horizontally to see more"');
  expect(board).toContain('tabIndex={0}');
  const boardStyles=read("src/components/projects/legacy-project-board.module.css");
  expect(board).toContain('styles["scrollRegion"]+" focus-visible:outline-2');
  expect(boardStyles).toMatch(/\.scrollRegion\s*\{[^}]*overflow-x:\s*auto;/);
  expect(boardStyles).toMatch(/\.scrollRegion\s*\{[^}]*overscroll-behavior-x:\s*contain;/);
  expect(board).toContain('Scroll sideways to see all Board lanes.');
  expect(board).toContain('focus-visible:outline-2');
  expect(board).toContain('min-h-11');
  expect(board).not.toContain('min-h-10');
 });
});
