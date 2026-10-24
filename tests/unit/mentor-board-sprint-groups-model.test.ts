import {describe,expect,it} from "vitest";
import {mentorBoardSprintGroups,mentorBoardSprintTaskCounts} from
 "@/modules/projects/mentor-board-sprint-groups-model";
const sprints=[
 {id:"s16",title:"Current",sequence:16,status:"ACTIVE",releaseId:"r3"},
 {id:"s15",title:"Earlier",sequence:15,status:"COMPLETED",releaseId:"r3"},
 {id:"s1",title:"Old release",sequence:1,status:"COMPLETED",releaseId:"r1"},
];
const tasks=[
 ...Array.from({length:190},(_,n)=>({id:"current-"+n,sprintId:"s16"})),
 ...Array.from({length:31},(_,n)=>({id:"old-"+n,sprintId:"s1"})),
 {id:"backlog",sprintId:null},
];
describe("Mentor Board complete sprint-list paging",()=>{
 it("does not lose an earlier sprint after more than 150 current tasks",()=>{
  const groups=mentorBoardSprintGroups(sprints,tasks);
  expect(groups.map(group=>group.id)).toEqual(["s16","s1","BACKLOG"]);
  expect(groups[0]).toMatchObject({allCount:190,remaining:170});
  expect(groups[1]).toMatchObject({allCount:31,remaining:11});
  expect(groups[2]).toMatchObject({allCount:1,remaining:0});
 });
 it("loads older groups independently without changing other group limits",()=>{
  const groups=mentorBoardSprintGroups(sprints,tasks,{s1:40});
  expect(groups.find(group=>group.id==="s1")?.tasks).toHaveLength(31);
  expect(groups.find(group=>group.id==="s1")?.remaining).toBe(0);
  expect(groups.find(group=>group.id==="s16")?.tasks).toHaveLength(20);
 });
 it("derives picker totals from exact filtered scope including backlog",()=>{
  const count=mentorBoardSprintTaskCounts(tasks);
  expect(count.get("s16")).toBe(190);
  expect(count.get("s1")).toBe(31);
  expect(count.get("BACKLOG")).toBe(1);
  expect(count.has("s15")).toBe(false);
 });
 it("does not mutate the source and bounds adversarial page counts",()=>{
  const result=mentorBoardSprintGroups(sprints,tasks,{s16:-100,s1:Infinity});
  expect(result[0]?.tasks).toHaveLength(20);
  expect(result[1]?.tasks).toHaveLength(20);
  expect(tasks).toHaveLength(222);
 });
});
