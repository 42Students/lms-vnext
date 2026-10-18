import {describe,expect,it} from "vitest";
import {allowedMentorTaskTransition,mentorTaskTransitionSchema} from "@/modules/projects/mentor-task-transition-model";
import {closeoutChecklist,mentorCloseoutSchema} from "@/modules/projects/mentor-closeout-model";
import {mentorMeetingDecisionSchema,mentorMeetingDecisionStatus} from "@/modules/projects/mentor-meeting-decision-model";
import {mentorProjectListQuerySchema} from "@/modules/projects/mentor-project-list-query";

const version="2099-01-01T00:00:00.000Z";
const baseTransition={status:"BLOCKED",expectedUpdatedAt:version,confirmed:true};
const baseCloseout={expectedUpdatedAt:version,confirmDeliveryReviewed:true,confirmTeamNotified:true,confirmCloseout:true};
const baseMeeting={action:"COMPLETE",expectedUpdatedAt:version,confirmed:true};
const ready={projectStatus:"ACTIVE",approved:true,openTasks:0,openSprints:0,openReleases:0};

describe("chat-14 Projects mentor state and scope policy matrix",()=>{
  it("mentor task allows TODO to IN_PROGRESS and BLOCKED; rejects no-op updates",()=>{
    expect(allowedMentorTaskTransition("TODO","IN_PROGRESS")).toBe(true);
    expect(allowedMentorTaskTransition("TODO","BLOCKED")).toBe(true);
    expect(allowedMentorTaskTransition("BLOCKED","TODO")).toBe(true);
    expect(allowedMentorTaskTransition("TODO","TODO")).toBe(false);
  });
  it("mentor task rejects mentor-only completion, review transitions, and unknown states",()=>{
    for(const [before,after] of [["TODO","DONE"],["IN_PROGRESS","IN_REVIEW"],["DONE","TODO"],["IN_REVIEW","BLOCKED"],["INVALID","TODO"]]){
      expect(allowedMentorTaskTransition(before,after)).toBe(false);
    }
  });
  it("mentor task accepts a confirmed optimistic update and bounded blocker note",()=>{
    expect(mentorTaskTransitionSchema.safeParse({...baseTransition,blockerReason:"Awaiting lab"}).success).toBe(true);
    expect(mentorTaskTransitionSchema.safeParse({...baseTransition,status:"IN_PROGRESS"}).success).toBe(true);
  });
  it("mentor task refuses missing confirmation, unsafe state, invalid version, oversized note, and unknown fields",()=>{
    for(const bad of [
      {...baseTransition,confirmed:false},
      {...baseTransition,status:"DONE"},
      {...baseTransition,expectedUpdatedAt:"2026-01-01"},
      {...baseTransition,blockerReason:"x".repeat(4001)},
      {...baseTransition,tenantId:"injected"},
    ]) expect(mentorTaskTransitionSchema.safeParse(bad).success).toBe(false);
  });
  it("mentor closeout requires all three explicit confirmations and a version token",()=>{
    expect(mentorCloseoutSchema.safeParse(baseCloseout).success).toBe(true);
    for(const key of ["confirmDeliveryReviewed","confirmTeamNotified","confirmCloseout"] as const){
      expect(mentorCloseoutSchema.safeParse({...baseCloseout,[key]:false}).success).toBe(false);
    }
    expect(mentorCloseoutSchema.safeParse({...baseCloseout,expectedUpdatedAt:"bad"}).success).toBe(false);
  });
  it("mentor closeout gates on approved delivery, zero open tasks/sprints/releases and ACTIVE project",()=>{
    const allowed=closeoutChecklist(ready);
    expect(allowed).toEqual({approvedDelivery:true,tasksDone:true,sprintsComplete:true,releasesShipped:true,canComplete:true});
    for(const fail of [
      {...ready,approved:false},
      {...ready,openTasks:1},
      {...ready,openSprints:1},
      {...ready,openReleases:1},
      {...ready,projectStatus:"COMPLETED"},
      {...ready,projectStatus:"ARCHIVED"},
    ]) expect(closeoutChecklist(fail).canComplete).toBe(false);
  });
  it("mentor meeting accepts completion only when scheduled and cancellation while requested",()=>{
    expect(mentorMeetingDecisionStatus("COMPLETE","SCHEDULED")).toBe(true);
    expect(mentorMeetingDecisionStatus("COMPLETE","RESCHEDULED")).toBe(true);
    expect(mentorMeetingDecisionStatus("COMPLETE","REQUESTED")).toBe(false);
    expect(mentorMeetingDecisionStatus("CANCEL","REQUESTED")).toBe(true);
    expect(mentorMeetingDecisionStatus("CANCEL","DRAFT")).toBe(true);
    expect(mentorMeetingDecisionStatus("CANCEL","COMPLETED")).toBe(false);
  });
  it("mentor meeting rejects contradictory notes/outcomes and unconfirmed requests",()=>{
    expect(mentorMeetingDecisionSchema.safeParse({...baseMeeting,outcome:"Reviewed"}).success).toBe(true);
    expect(mentorMeetingDecisionSchema.safeParse({...baseMeeting,note:"Cancel note"}).success).toBe(false);
    expect(mentorMeetingDecisionSchema.safeParse({...baseMeeting,action:"CANCEL",note:"Room unavailable"}).success).toBe(true);
    expect(mentorMeetingDecisionSchema.safeParse({...baseMeeting,action:"CANCEL",outcome:"Wrong field"}).success).toBe(false);
    expect(mentorMeetingDecisionSchema.safeParse({...baseMeeting,confirmed:false}).success).toBe(false);
  });
  it("mentor project query rejects cross-tenant selectors and oversized search",()=>{
    for(const selector of ["collegeId","organizationId","tenantId"] as const){
      expect(mentorProjectListQuerySchema.safeParse({[selector]:"other-tenant"}).success).toBe(false);
    }
    expect(mentorProjectListQuerySchema.safeParse({search:"x".repeat(121)}).success).toBe(false);
    expect(mentorProjectListQuerySchema.safeParse({pageSize:12}).success).toBe(false);
  });
  it("mentor project query preserves legacy unknown query keys while bounding paging",()=>{
    const query=mentorProjectListQuerySchema.parse({oldTab:"ignored",page:"0",pageSize:"25",status:"",sort:"RECENT"});
    expect(query.page).toBe(1);
    expect(query.pageSize).toBe(25);
    expect("oldTab" in query).toBe(false);
    expect(query.status).toBeUndefined();
    expect(mentorProjectListQuerySchema.safeParse({page:10001}).success).toBe(false);
  });
});
