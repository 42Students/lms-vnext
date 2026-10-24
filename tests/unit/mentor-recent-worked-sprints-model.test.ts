import {describe,expect,it} from "vitest";
import {recentMentorWorkedSprintIds} from
  "@/modules/projects/mentor-recent-worked-sprints-model";

const sprint=(sequence:number,status:string)=>({
  id:"sprint-"+sequence,sequence,status,
});

describe("Mentor last-four worked sprint window",()=>{
  it("ignores four future planned sprints in the 16-sprint prototype state",()=>{
    const sprints=Array.from({length:16},(_,index)=>
      sprint(index+1,index<11?"COMPLETED":index===11?"ACTIVE":"PLANNED"));
    expect(recentMentorWorkedSprintIds(sprints))
      .toEqual(["sprint-12","sprint-11","sprint-10","sprint-9"]);
  });

  it("includes the current active sprint with recently completed history",()=>{
    const sprints=[
      sprint(7,"COMPLETED"),sprint(11,"COMPLETED"),
      sprint(13,"ACTIVE"),sprint(12,"COMPLETED"),
      sprint(14,"PLANNED"),sprint(10,"COMPLETED"),
    ];
    expect(recentMentorWorkedSprintIds(sprints))
      .toEqual(["sprint-13","sprint-12","sprint-11","sprint-10"]);
  });

  it("handles zero, fewer than four and only future planned periods",()=>{
    expect(recentMentorWorkedSprintIds([])).toEqual([]);
    expect(recentMentorWorkedSprintIds([
      sprint(3,"PLANNED"),sprint(2,"COMPLETED"),
      sprint(1,"COMPLETED"),
    ])).toEqual(["sprint-2","sprint-1"]);
    expect(recentMentorWorkedSprintIds([
      sprint(6,"PLANNED"),sprint(5,"PLANNED"),
    ])).toEqual([]);
  });

  it("keeps the latest four chronological across release-local sequence reset",()=>{
    const releases=[{id:"r1",sequence:0},{id:"r2",sequence:1}];
    const rows=[
      {id:"r1-s2",releaseId:"r1",sequence:2,status:"COMPLETED"},
      {id:"r1-s3",releaseId:"r1",sequence:3,status:"COMPLETED"},
      {id:"r1-s4",releaseId:"r1",sequence:4,status:"COMPLETED"},
      {id:"r2-s0",releaseId:"r2",sequence:0,status:"COMPLETED"},
      {id:"r2-s1",releaseId:"r2",sequence:1,status:"ACTIVE"},
      {id:"r2-s2",releaseId:"r2",sequence:2,status:"PLANNED"},
    ];
    expect(recentMentorWorkedSprintIds(rows,releases)).toEqual([
      "r2-s1","r2-s0","r1-s4","r1-s3",
    ]);
  });

  it("does not alter its caller's ordering",()=>{
    const sprints=[sprint(9,"COMPLETED"),sprint(11,"ACTIVE"),
      sprint(10,"COMPLETED"),sprint(12,"PLANNED")];
    const before=sprints.map(item=>item.id);
    expect(recentMentorWorkedSprintIds(sprints))
      .toEqual(["sprint-11","sprint-10","sprint-9"]);
    expect(sprints.map(item=>item.id)).toEqual(before);
  });
});
