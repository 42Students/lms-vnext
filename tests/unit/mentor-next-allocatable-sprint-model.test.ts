import {describe,expect,it} from "vitest";
import {nextMentorAllocatableSprint} from
  "@/modules/projects/mentor-next-allocatable-sprint-model";

const releases=[
  {id:"r1",sequence:0,status:"ACTIVE"},
  {id:"r2",sequence:1,status:"PLANNED"},
  {id:"r3",sequence:2,status:"PLANNED"},
];
const sprints=[
  {id:"r1-s12",releaseId:"r1",sequence:12,status:"ACTIVE"},
  {id:"r2-s1",releaseId:"r2",sequence:0,status:"PLANNED"},
  {id:"r2-s2",releaseId:"r2",sequence:1,status:"PLANNED"},
  {id:"r3-s1",releaseId:"r3",sequence:0,status:"PLANNED"},
];
describe("Mentor next-sprint assignment target",()=>{
  it("finds the first sprint of the next release when numbering resets",()=>{
    expect(nextMentorAllocatableSprint([...sprints].reverse(),releases))
      .toMatchObject({id:"r2-s1"});
    expect(nextMentorAllocatableSprint(sprints,releases)?.sequence).toBe(0);
  });
  it("never chooses an earlier sprint or any sprint in a shipped release",()=>{
    expect(nextMentorAllocatableSprint(sprints,releases.map(release=>
      release.id==="r2"?{...release,status:"SHIPPED"}:release))?.id)
      .toBe("r3-s1");
    expect(nextMentorAllocatableSprint(sprints,releases.map(release=>({
      ...release,status:"SHIPPED",
    })))).toBeNull();
  });
  it("uses the earliest planned sprint if none is active and skips malformed sequence",()=>{
    expect(nextMentorAllocatableSprint(
      sprints.map(item=>({...item,status:item.status==="ACTIVE"?"COMPLETED":item.status})),
      releases)?.id).toBe("r2-s1");
    expect(nextMentorAllocatableSprint([
      {id:"invalid",releaseId:"r2",status:"PLANNED"},
      {id:"valid",releaseId:"r2",sequence:0,status:"PLANNED"},
      {id:"foreign",releaseId:"unknown",sequence:0,status:"PLANNED"},
    ],releases)?.id).toBe("valid");
  });
  it("does not skip the next release when the previous release had larger sprint numbers",()=>{
    const candidates=[
      {id:"future-r1",releaseId:"r1",sequence:99,status:"PLANNED"},
      ...sprints,
    ];
    expect(nextMentorAllocatableSprint(candidates,releases)?.id).toBe("future-r1");
    expect(nextMentorAllocatableSprint(candidates.map(item=>({...item,
      status:item.id==="future-r1"?"COMPLETED":item.status,
    })),releases)?.id).toBe("r2-s1");
  });
});
