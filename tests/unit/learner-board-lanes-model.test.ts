import {describe,it,expect} from "vitest";
import {groupLearnerBoardLanes,learnerTaskLane} from "@/modules/projects/learner-board-lanes-model";
const sprints=[{id:"planned",status:"PLANNED"},{id:"active",status:"ACTIVE"}];
const tasks=[{id:"a",status:"TODO",sprintId:"planned"},
 {id:"b",status:"TODO",sprintId:"active"},
 {id:"c",status:"IN_PROGRESS",sprintId:"active"},
 {id:"d",status:"IN_REVIEW",sprintId:"active"},
 {id:"e",status:"BLOCKED",sprintId:"active"},
 {id:"f",status:"DONE",sprintId:"active"}];
describe("LEARNER-projects-24 saved Board lanes",()=>{
 it("groups backlog and each workflow lane without losing or duplicating tasks",()=>{
  const grouped=groupLearnerBoardLanes(tasks,sprints);
  expect(grouped.map(g=>g.label)).toEqual(["Backlog","To Do","In Progress","In Review","Blocked","Completed"]);
  expect(grouped.flatMap(g=>g.tasks.map(t=>t.id))).toEqual(["a","b","c","d","e","f"]);
  expect(grouped.map(g=>g.tasks.length)).toEqual([1,1,1,1,1,1]);
 });
 it("does not call historical done work a backlog item",()=>{
  expect(learnerTaskLane({status:"DONE",sprintId:"planned"},new Map([["planned","PLANNED"]]))).toBe("DONE");
 });
});
