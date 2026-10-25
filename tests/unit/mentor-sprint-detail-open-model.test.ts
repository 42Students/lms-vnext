import {describe,expect,it} from "vitest";
import {mentorSprintOpenCount} from "@/modules/projects/mentor-sprint-detail-open-model";
import {buildMentorSprintSignOffSnapshot} from "@/modules/projects/mentor-sprint-signoff-snapshot-model";

describe("Mentor sprint detail open-task columns",()=>{
  it("counts only current actionable open tasks for planned and active sprints",()=>{
    const statuses=["TODO","BLOCKED","IN_PROGRESS","DONE","IN_REVIEW"];
    expect(mentorSprintOpenCount("ACTIVE",statuses,null)).toBe(3);
    expect(mentorSprintOpenCount("PLANNED",["DONE","IN_REVIEW"],null)).toBe(0);
  });
  it("reads saved pre-carry signoff counts even after tasks move away",()=>{
    const snapshot=buildMentorSprintSignOffSnapshot("sprint-1",[
      {status:"DONE",estimatePoints:3,assigneeMembershipId:"alice",carriedFromSprintId:null},
      {status:"BLOCKED",estimatePoints:5,assigneeMembershipId:null,carriedFromSprintId:null},
      {status:"TODO",estimatePoints:2,assigneeMembershipId:"alice",carriedFromSprintId:null},
      {status:"IN_REVIEW",estimatePoints:1,assigneeMembershipId:"bob",carriedFromSprintId:null},
    ]);
    expect(mentorSprintOpenCount("COMPLETED",[],snapshot)).toBe(2);
    expect(mentorSprintOpenCount("COMPLETED",["DONE"],snapshot)).toBe(2);
  });
  it("does not manufacture historical zeroes for missing imported snapshots",()=>{
    expect(mentorSprintOpenCount("COMPLETED",[],null)).toBeNull();
  });
});
