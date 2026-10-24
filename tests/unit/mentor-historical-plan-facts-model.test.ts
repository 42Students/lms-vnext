import {describe,expect,it} from "vitest";
import {deriveMentorPlanFacts} from "@/modules/projects/mentor-historical-plan-facts-model";
const snapshots=[
 {sprintId:"s1",plannedPoints:9,donePoints:5,taskCount:3,
  memberRows:[{membershipId:"ravi",carriedCount:1,taskCount:2},
    {membershipId:"maya",carriedCount:0,taskCount:1}]},
 {sprintId:"s2",plannedPoints:11,donePoints:8,taskCount:4,
  memberRows:[{membershipId:"ravi",carriedCount:2,taskCount:3},
    {membershipId:"maya",carriedCount:1,taskCount:1}]},
];
const sprints=[
 {id:"s1",sequence:1,status:"COMPLETED"},
 {id:"s2",sequence:2,status:"COMPLETED"},
 {id:"s3",sequence:3,status:"ACTIVE"},
 {id:"s4",sequence:4,status:"PLANNED"},
 {id:"s5",sequence:5,status:"PLANNED"},
 {id:"s6",sequence:6,status:"PLANNED"},
];
describe("Mentor historical sprint plan and carry facts",()=>{
 it("keeps sign-off history and originally planned commitments after task moves",()=>{
  const result=deriveMentorPlanFacts({
   sprints,signOffs:snapshots,starts:[
    {...snapshots[0]!,plannedPoints:12},
    {...snapshots[1]!,plannedPoints:14},
    {sprintId:"s3",plannedPoints:10,donePoints:0,taskCount:2,memberRows:[]},
   ],
   tasks:[
    {sprintId:"s3",estimatePoints:4,status:"DONE"},
    {sprintId:"s4",estimatePoints:9,status:"TODO"},
    {sprintId:"s5",estimatePoints:5,status:"TODO"},
    {sprintId:"s6",estimatePoints:90,status:"TODO"},
    {sprintId:null,estimatePoints:8,status:"TODO"},
   ],
  });
  expect(result).toMatchObject({
   signedOff:2,totalSprints:6,completedDonePoints:17,
   plannedToDatePoints:36,plannedToDateReliable:true,
   nextTwoEstimatePoints:14,observedCompletedSprints:2,
   carriedIntoCompleted:4,observedTaskCount:7,
   carryRatioPct:57.1,primaryCarrier:{membershipId:"ravi",count:3},
  });
  expect(result.nextTwo.map(item=>item.sequence)).toEqual([4,5]);
 });
 it("labels missing start-time facts and missing sign-offs instead of inventing zero history",()=>{
  const result=deriveMentorPlanFacts({
   sprints,signOffs:[snapshots[0]!],starts:[],tasks:[],
  });
  expect(result.plannedToDateReliable).toBe(false);
  expect(result.missingSignOffIds).toEqual(["s2"]);
  expect(result.missingStartCommitmentIds).toEqual(["s1","s2"]);
  expect(result.carriedIntoCompleted).toBe(1);
  expect(result.observedCompletedSprints).toBe(1);
 });
 it("excludes deleted tasks and future sequence ahead of next two",()=>{
  const result=deriveMentorPlanFacts({
   sprints,signOffs:[],starts:[],tasks:[
    {sprintId:"s4",estimatePoints:100,status:"TODO",deletedAt:new Date()},
    {sprintId:"s4",estimatePoints:null,status:"TODO"},
    {sprintId:"s5",estimatePoints:5,status:"DONE"},
   ],
  });
  expect(result.nextTwoEstimatePoints).toBe(5);
  expect(result.carryRatioPct).toBeNull();
  expect(result.primaryCarrier).toBeNull();
 });
 it("uses release and sprint order when the next release resets its sequence",()=>{
  const result=deriveMentorPlanFacts({
    releases:[{id:"r1",sequence:0},{id:"r2",sequence:1}],
    sprints:[
      {id:"already",releaseId:"r1",sequence:5,status:"COMPLETED"},
      {id:"now",releaseId:"r1",sequence:6,status:"ACTIVE"},
      {id:"earlier",releaseId:"r1",sequence:4,status:"PLANNED"},
      {id:"next",releaseId:"r2",sequence:0,status:"PLANNED"},
      {id:"after",releaseId:"r2",sequence:1,status:"PLANNED"},
      {id:"later",releaseId:"r2",sequence:2,status:"PLANNED"},
    ],
    signOffs:[],starts:[],tasks:[
      {sprintId:"earlier",status:"TODO",estimatePoints:99},
      {sprintId:"next",status:"TODO",estimatePoints:7},
      {sprintId:"after",status:"TODO",estimatePoints:3},
      {sprintId:"later",status:"TODO",estimatePoints:20},
    ],
  });
  expect(result.nextTwo.map(row=>row.sprintId)).toEqual(["next","after"]);
  expect(result.nextTwoEstimatePoints).toBe(10);
 });
 it("handles cross-release zero-estimate plans and no backlog without invented velocity",()=>{
  const result=deriveMentorPlanFacts({
   releases:[{id:"old-release",sequence:0},{id:"new-release",sequence:1}],
   sprints:[
     {id:"active",releaseId:"old-release",sequence:9,status:"ACTIVE"},
     {id:"future",releaseId:"new-release",sequence:0,status:"PLANNED"},
     {id:"later",releaseId:"new-release",sequence:1,status:"PLANNED"},
   ],
   starts:[],signOffs:[],
   tasks:[
     {sprintId:"future",status:"TODO",estimatePoints:null},
     {sprintId:"later",status:"TODO",estimatePoints:0},
     {sprintId:"later",status:"TODO",estimatePoints:100,deletedAt:new Date()},
   ],
  });
  expect(result.nextTwo.map(item=>item.sprintId)).toEqual(["future","later"]);
  expect(result.nextTwoEstimatePoints).toBe(0);
  expect(result.plannedToDatePoints).toBe(0);
  expect(result.plannedToDateReliable).toBe(false);
  expect(result.carryRatioPct).toBeNull();
 });
 it("handles no sprint without fabricating a forecast denominator",()=>{
  const result=deriveMentorPlanFacts({sprints:[],signOffs:[],starts:[],tasks:[]});
  expect(result).toMatchObject({
   signedOff:0,totalSprints:0,plannedToDatePoints:0,
   completedDonePoints:0,plannedToDateReliable:true,
   nextTwo:[],carryRatioPct:null,
  });
 });
});
