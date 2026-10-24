import {describe,expect,it} from "vitest";
import {mentorFewestRecordedContributors} from
 "@/modules/projects/mentor-week-contributor-model";
describe("Mentor student activity comparison",()=>{
 it("identifies the fewest recorded actions including a genuine zero",()=>{
  expect(mentorFewestRecordedContributors([
   {membershipId:"a",name:"Ravi",eventCount:7},
   {membershipId:"b",name:"Maya",eventCount:0},
   {membershipId:"c",name:"Tara",eventCount:4},
  ])).toEqual({kind:"RESULT",count:0,members:[
   {membershipId:"b",name:"Maya",eventCount:0},
  ]});
 });
 it("reports every tied student instead of inventing an individual loser",()=>{
  const result=mentorFewestRecordedContributors([
   {membershipId:"b",name:"Zara",eventCount:2},
   {membershipId:"a",name:"Amal",eventCount:2},
   {membershipId:"c",name:"Mina",eventCount:4},
  ]);
  expect(result.kind).toBe("RESULT");
  if(result.kind==="RESULT")
   expect(result.members.map(row=>row.name)).toEqual(["Amal","Zara"]);
 });
 it("avoids activity rankings with fewer than two active learners",()=>{
  expect(mentorFewestRecordedContributors([]).kind).toBe("UNAVAILABLE");
  expect(mentorFewestRecordedContributors([
   {membershipId:"a",name:"Ravi",eventCount:0},
  ]).kind).toBe("UNAVAILABLE");
 });
 it("does not extrapolate invalid counts",()=>{
  expect(mentorFewestRecordedContributors([
   {membershipId:"a",name:"Ravi",eventCount:-3},
   {membershipId:"b",name:"Maya",eventCount:2},
  ]).kind).toBe("UNAVAILABLE");
 });
});
