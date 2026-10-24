import {describe,expect,it} from "vitest";
import {nextMentorBoardFocus} from
 "@/modules/projects/mentor-board-keyboard-focus-model";
import {mentorBoardSprintGroups} from
 "@/modules/projects/mentor-board-sprint-groups-model";
describe("Mentor Board J/K reveals long sprint history groups",()=>{
 it("selects an old-sprint task beyond its independent 20-row limit",()=>{
  const tasks=[
   ...Array.from({length:190},(_,i)=>({id:"current-"+i,sprintId:"new"})),
   ...Array.from({length:43},(_,i)=>({id:"past-"+i,sprintId:"old"})),
  ];
  const candidate=nextMentorBoardFocus(tasks.map(task=>task.id),"past-19","j");
  expect(candidate).toEqual({id:"past-20",index:210});
  const nextTask=tasks[candidate!.index]!;
  const key=nextTask.sprintId??"BACKLOG";
  const groupIndex=tasks.filter(task=>(task.sprintId??"BACKLOG")===key)
    .findIndex(task=>task.id===candidate?.id);
  const result=mentorBoardSprintGroups([
   {id:"new",title:"New",sequence:4,status:"ACTIVE",releaseId:"r2"},
   {id:"old",title:"Old",sequence:2,status:"COMPLETED",releaseId:"r1"},
  ],tasks,{[key]:Math.max(20,groupIndex+1)});
  expect(result.find(group=>group.id==="old")?.tasks.some(task=>
    task.id===candidate?.id)).toBe(true);
  expect(result.find(group=>group.id==="new")?.tasks).toHaveLength(20);
 });
 it("can reach backlog tasks using the same group key used by paging",()=>{
  const tasks=[{id:"old",sprintId:"sprint"},{id:"backlog",sprintId:null}];
  const candidate=nextMentorBoardFocus(tasks.map(task=>task.id),"old","j");
  expect(tasks[candidate!.index]?.sprintId??"BACKLOG").toBe("BACKLOG");
 });
});
