import {describe,expect,it} from "vitest";
import {planMentorNextSprintAssignments} from
  "@/modules/projects/mentor-next-sprint-assignment-model";

const task=(id:string,sprintId:string|null,assigneeMembershipId:string|null,
  estimatePoints:number|null,status="TODO",sequence=1)=>({
  id,sprintId,assigneeMembershipId,estimatePoints,status,sequence,deletedAt:null,
});
describe("Mentor next-sprint point-balanced planner",()=>{
 it("only chooses unassigned editable tasks in the specified upcoming sprint",()=>{
  const tasks=[
    task("other","old",null,2),
    task("next-1","next",null,5),
    task("next-2","next",null,3,"BLOCKED",2),
    task("review","next",null,8,"IN_REVIEW"),
    task("done","next",null,8,"DONE"),
    {...task("deleted","next",null,4),deletedAt:new Date()},
  ];
  const plan=planMentorNextSprintAssignments(tasks,["a","b"],"next");
  expect(plan.assignments.map(item=>item.taskId)).toEqual(["next-1","next-2"]);
  expect(plan.assignments.map(item=>item.membershipId)).toEqual(["a","b"]);
 });
 it("balances open point loads before task counts with stable tie breaking",()=>{
  const tasks=[
    task("a-load","old","a",10),
    task("b-load","old","b",2),
    task("c-load","old","c",2),
    task("next","next",null,4),
  ];
  const plan=planMentorNextSprintAssignments(tasks,["c","b","a"],"next");
  expect(plan.assignments[0]?.membershipId).toBe("b");
  expect(plan.loads.find(item=>item.membershipId==="b")).toMatchObject({
    beforePoints:2,afterPoints:6,
  });
 });
 it("never assigns tasks to a removed/unknown project member",()=>{
  const plan=planMentorNextSprintAssignments([
    task("former","old","removed",100),
    task("needed","next",null,5),
  ],["active"],"next");
  expect(plan.assignments.map(row=>row.membershipId)).toEqual(["active"]);
 });
 it("ignores historical closed-sprint assignee loads and never targets shipped sprint work",()=>{
  const tasks=[
    task("archived-closed","completed","a",50,"BLOCKED"),
    task("shipped","shipped","b",22),
    task("current","active","b",3),
    task("next","next",null,4),
  ];
  const openIds=new Set(["active","next"]);
  const plan=planMentorNextSprintAssignments(tasks,["a","b"],"next",openIds);
  expect(plan.assignments.map(row=>row.membershipId)).toEqual(["a"]);
  expect(plan.loads.find(row=>row.membershipId==="a")?.beforePoints).toBe(0);
  expect(plan.loads.find(row=>row.membershipId==="b")?.beforePoints).toBe(3);
  expect(planMentorNextSprintAssignments(tasks,["a","b"],"shipped",openIds)
    .assignments).toHaveLength(0);
 });
 it("handles no eligible members without inventing assignment success",()=>{
  const tasks=[task("needed","next",null,null)];
  expect(planMentorNextSprintAssignments(tasks,[],"next").assignments).toEqual([]);
  expect(planMentorNextSprintAssignments(tasks,[],"next").loads).toEqual([]);
 });
 it("does not mutate the task or roster arrays",()=>{
  const tasks=[task("b","next",null,3,"TODO",2),
    task("a","next",null,1,"TODO",1)];
  const students=["b","a"];
  planMentorNextSprintAssignments(tasks,students,"next");
  expect(tasks.map(row=>row.id)).toEqual(["b","a"]);
  expect(students).toEqual(["b","a"]);
 });
});
