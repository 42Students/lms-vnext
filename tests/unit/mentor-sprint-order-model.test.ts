import {describe,expect,it} from "vitest";
import {isLaterMentorSprint,nextPlannedMentorSprint,orderMentorSprints,
  mentorSprintDefaultReleaseId}
  from "@/modules/projects/mentor-sprint-order-model";

const releases=[
  {id:"release-1",sequence:0},
  {id:"release-2",sequence:1},
];
const sprints=[
  {id:"sprint-1",releaseId:"release-1",sequence:0,status:"COMPLETED"},
  {id:"sprint-2",releaseId:"release-1",sequence:1,status:"ACTIVE"},
  {id:"sprint-3",releaseId:"release-2",sequence:0,status:"PLANNED"},
  {id:"sprint-4",releaseId:"release-2",sequence:1,status:"PLANNED"},
];
describe("Mentor sprint order across releases",()=>{
  it("treats a reset sprint number in the later release as later work",()=>{
    expect(isLaterMentorSprint(
      {releaseSequence:0,sprintSequence:1},
      {releaseSequence:1,sprintSequence:0},
    )).toBe(true);
    expect(isLaterMentorSprint(
      {releaseSequence:1,sprintSequence:0},
      {releaseSequence:0,sprintSequence:1},
    )).toBe(false);
  });
  it("orders release before release-local sprint sequence",()=>{
    expect(orderMentorSprints([sprints[2]!,sprints[1]!,sprints[3]!,sprints[0]!],
      releases).map(row=>row.id)).toEqual([
        "sprint-1","sprint-2","sprint-3","sprint-4",
      ]);
  });
  it("selects first following planned sprint across the boundary",()=>{
    expect(nextPlannedMentorSprint(sprints[1]!,sprints,releases)?.id).toBe("sprint-3");
    expect(nextPlannedMentorSprint(sprints[2]!,sprints,releases)?.id).toBe("sprint-4");
    expect(nextPlannedMentorSprint(sprints[3]!,sprints,releases)).toBeNull();
  });
  it("preselects the clicked active release even with several alternatives",()=>{
    const choices=[
      {id:"r1",status:"IN_PROGRESS"},
      {id:"r2",status:"PLANNED"},
      {id:"r3",status:"SHIPPED"},
    ];
    expect(mentorSprintDefaultReleaseId("r2",choices)).toBe("r2");
    expect(mentorSprintDefaultReleaseId("r1",choices)).toBe("r1");
    expect(mentorSprintDefaultReleaseId("r3",choices)).toBe("");
    expect(mentorSprintDefaultReleaseId("foreign",choices)).toBe("");
  });
  it("does not return unrelated or earlier planned sprints",()=>{
    expect(nextPlannedMentorSprint(
      {id:"foreign",releaseId:"release-1",sequence:0,status:"ACTIVE"},
      sprints,releases,
    )).toBeNull();
    const onlyEarlier=sprints.map(sprint=>({...sprint,
      status:sprint.id==="sprint-1"?"PLANNED":"COMPLETED"}));
    expect(nextPlannedMentorSprint(onlyEarlier[1]!,onlyEarlier,releases)).toBeNull();
  });
});
