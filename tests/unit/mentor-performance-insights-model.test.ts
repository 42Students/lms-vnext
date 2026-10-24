import {describe,expect,it} from "vitest";
import {mentorMemberSprintHistory,deriveMentorPerformanceInsights} from
  "@/modules/projects/mentor-performance-insights-model";
import {buildMentorSprintSignOffSnapshot} from
  "@/modules/projects/mentor-sprint-signoff-snapshot-model";

const member="00000000-0000-4000-8000-000000000001";
const snapshot=(id:string,status:string,points:number,carry:string|null=null)=>
  buildMentorSprintSignOffSnapshot(id,[{
    status,estimatePoints:points,assigneeMembershipId:member,
    carriedFromSprintId:carry,
  }]);
const ids=["s1","s2","s3","s4"];
const sprints=ids.map((id,i)=>({id,sequence:i+1,status:"COMPLETED"}));

describe("Mentor historical member performance insights",()=>{
  it("lists recorded sign-off points in sequence order, excluding missing snapshots",()=>{
    const rows=mentorMemberSprintHistory(member,[...sprints].reverse(),
      [snapshot("s1","DONE",4),snapshot("s3","DONE",6)]);
    expect(rows.map(item=>[item.sequence,item.donePoints])).toEqual([[1,4],[3,6]]);
  });
  it("identifies repeated incoming carried tasks from three real sign-offs",()=>{
    const rows=mentorMemberSprintHistory(member,sprints,[
      snapshot("s2","TODO",5,"s1"),
      snapshot("s3","DONE",5),
      snapshot("s4","BLOCKED",3,"s3"),
    ]);
    expect(deriveMentorPerformanceInsights({
      points:rows,currentOpenCount:0,totalProjectOpen:0,
    }).map(item=>item.code)).toEqual(["REPEATED_CARRY"]);
  });
  it("needs three observed sign-offs before flagging repeated zero-earned points",()=>{
    const two=mentorMemberSprintHistory(member,sprints,[
      snapshot("s1","TODO",3),snapshot("s3","TODO",2),
    ]);
    expect(deriveMentorPerformanceInsights({
      points:two,currentOpenCount:1,totalProjectOpen:5,
    })).toEqual([]);
    const three=mentorMemberSprintHistory(member,sprints,[
      snapshot("s1","TODO",3),snapshot("s2","TODO",2),
      snapshot("s3","BLOCKED",5),
    ]);
    expect(deriveMentorPerformanceInsights({
      points:three,currentOpenCount:0,totalProjectOpen:0,
    }).map(item=>item.code)).toEqual(["LOW_RECORDED_WORK"]);
  });
  it("uses genuine task concentration thresholds and avoids tiny teams",()=>{
    const concentrated=deriveMentorPerformanceInsights({
      points:[],currentOpenCount:6,totalProjectOpen:9,
    });
    expect(concentrated.map(item=>item.code)).toEqual(["CONCENTRATED_ASSIGNMENTS"]);
    expect(deriveMentorPerformanceInsights({
      points:[],currentOpenCount:3,totalProjectOpen:5,
    })).toEqual([]);
  });
});
