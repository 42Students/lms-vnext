import {describe,expect,it} from "vitest";
import {projectMeetingTransitionPayload} from "@/modules/projects/project-meeting-transition-payload-model";
import {projectMeetingTransitionInputSchema} from "@/modules/projects/validation";
import {mentorMeetingDecisionSchema} from "@/modules/projects/mentor-meeting-decision-model";

const timestamp="2099-01-01T00:00:00.000Z";

describe("Meeting transition payload preserves displayed revision across role journeys",()=>{
 it("PROJ-BREAK-MENTOR-395 admin COMPLETE and learner CANCEL both submit CAS tokens",()=>{
  const admin=projectMeetingTransitionPayload("COMPLETE","ADMIN",new Date(timestamp),"Reviewed.");
  const learner=projectMeetingTransitionPayload("CANCEL","LEARNER",timestamp,"No longer needed");
  expect(admin).toEqual({
   action:"COMPLETE",expectedUpdatedAt:timestamp,outcome:"Reviewed.",
  });
  expect(learner).toEqual({
   action:"CANCEL",expectedUpdatedAt:timestamp,note:"No longer needed",
  });
  expect(projectMeetingTransitionInputSchema.safeParse(admin).success).toBe(true);
  expect(projectMeetingTransitionInputSchema.safeParse(learner).success).toBe(true);
  expect(admin).not.toHaveProperty("confirmed");
  expect(learner).not.toHaveProperty("confirmed");
 });
 it("PROJ-BREAK-MENTOR-396 Mentor decision preserves required confirmation and version token",()=>{
  for(const action of ["COMPLETE","CANCEL"] as const){
   const payload=projectMeetingTransitionPayload(action,"MENTOR",timestamp,"Agenda checked");
   expect(payload).toMatchObject({action,expectedUpdatedAt:timestamp,confirmed:true});
   expect(mentorMeetingDecisionSchema.safeParse(payload).success).toBe(true);
  }
 });
 it("PROJ-BREAK-MENTOR-397 empty notes stay optional while IST instants normalize to UTC",()=>{
  const ist="2099-01-01T05:30:00.000+05:30";
  for(const mode of ["LEARNER","MENTOR","ADMIN"] as const){
   const payload=projectMeetingTransitionPayload("CANCEL",mode,ist,"  ");
   expect(payload.expectedUpdatedAt).toBe(timestamp);
   expect(payload.note).toBeUndefined();
   if(mode!=="MENTOR")
    expect(projectMeetingTransitionInputSchema.safeParse(payload).success).toBe(true);
   else
    expect(mentorMeetingDecisionSchema.safeParse(payload).success).toBe(true);
  }
 });
});
