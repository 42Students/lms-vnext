import {describe,expect,it} from "vitest";
import {projectSprintPlanSchema} from "@/modules/projects/project-sprint-plan-model";
import {projectTaskPlanSchema} from "@/modules/projects/project-task-plan-model";

const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
const sprint=(n:number,key:string)=>({
 id:id(n),expectedUpdatedAt:"2026-10-22T12:00:00.000Z",key,title:"Sprint "+n,
 dueLabel:null,description:null,goal:null,definitionOfDone:null,
 startDate:null,endDate:null,dueDate:null,
});
const task=(n:number,key:string)=>({
 id:id(n),key,title:"Task "+n,priority:"MEDIUM" as const,sprintId:null,
 estimatePoints:null,taskType:null,dueLabel:null,description:null,
 acceptanceCriteria:null,approach:null,
});

describe("legacy workspace section optimistic edit validation",()=>{
 it("preserves distinct sprint keys on simultaneous title/key remaps",()=>{
  const input={releaseId:id(99),sprints:[sprint(1,"new-key"),sprint(2,"new-key")]};
  expect(projectSprintPlanSchema.safeParse(input).success).toBe(false);
  expect(projectSprintPlanSchema.safeParse({...input,sprints:[
   sprint(1,"new-key"),sprint(2,"different-key"),
  ]}).success).toBe(true);
 });
 it("rejects repeated sprint identities even when titles differ",()=>{
  expect(projectSprintPlanSchema.safeParse({releaseId:id(99),sprints:[
   sprint(1,"one"),sprint(1,"two"),
  ]}).success).toBe(false);
 });
 it("requires unique task keys and preserves a section snapshot token",()=>{
  const source={expectedTasksToken:"a".repeat(64),tasks:[task(1,"one"),task(2,"two")]};
  expect(projectTaskPlanSchema.safeParse(source).success).toBe(true);
  expect(projectTaskPlanSchema.safeParse({...source,tasks:[
   task(1,"same"),task(2,"SAME"),
  ]}).success).toBe(false);
  expect(projectTaskPlanSchema.safeParse({...source,expectedTasksToken:"stale"}).success).toBe(false);
 });
});
