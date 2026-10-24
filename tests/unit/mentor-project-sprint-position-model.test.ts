import {describe,expect,it} from "vitest";
import {summarizeMentorProjectSprints}
  from "@/modules/projects/mentor-project-sprint-position-model";

describe("Mentor Project roster release-scoped sprint timeline",()=>{
  it("shows the active sprint's project-wide position after local numbering restarts",()=>{
    const projectId="project-a";
    const result=summarizeMentorProjectSprints([
      {id:"new-active",projectId,releaseSequence:2,sequence:0,status:"ACTIVE"},
      {id:"old-2",projectId,releaseSequence:1,sequence:2,status:"COMPLETED"},
      {id:"new-next",projectId,releaseSequence:2,sequence:1,status:"PLANNED"},
      {id:"old-1",projectId,releaseSequence:1,sequence:1,status:"COMPLETED"},
    ]).get(projectId);
    expect(result).toMatchObject({
      total:4,completed:2,activeSequence:3,
    });
    expect(result?.segments.map(s=>[s.releaseSequence,s.sequence,s.status]))
      .toEqual([[1,1,"COMPLETED"],[1,2,"COMPLETED"],
        [2,0,"ACTIVE"],[2,1,"PLANNED"]]);
  });
  it("keeps project histories separate and stable at equal sprint positions",()=>{
    const summaries=summarizeMentorProjectSprints([
      {id:"b2",projectId:"b",releaseSequence:0,sequence:1,status:"ACTIVE"},
      {id:"a1",projectId:"a",releaseSequence:0,sequence:0,status:"COMPLETED"},
      {id:"b1",projectId:"b",releaseSequence:0,sequence:0,status:"PLANNED"},
      {id:"a2",projectId:"a",releaseSequence:0,sequence:1,status:"PLANNED"},
    ]);
    expect([...summaries.keys()]).toEqual(["a","b"]);
    expect(summaries.get("a")).toMatchObject({total:2,completed:1,activeSequence:null});
    expect(summaries.get("b")).toMatchObject({total:2,completed:0,activeSequence:2});
  });
  it("handles empty and future-only sprints without inventing an active period",()=>{
    expect(summarizeMentorProjectSprints([]).size).toBe(0);
    const row=summarizeMentorProjectSprints([
      {id:"planned",projectId:"a",releaseSequence:0,sequence:0,status:"PLANNED"},
    ]).get("a");
    expect(row).toMatchObject({total:1,completed:0,activeSequence:null});
  });
});
