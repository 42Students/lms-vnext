import {describe,expect,it} from "vitest";
import {
  learnerPlacementChoices,LEARNER_REGISTRATION_COPY,
  resolveLearnerRegistrationDisplay,
} from "@/modules/placements/learner-registration-view-model";
const date=new Date("2026-10-16T09:00:00.000Z");
describe("LEARNER-placements-50 registration states and exact legacy copy",()=>{
  it("is closed before invitation, after expiry and when finished",()=>{
    expect(resolveLearnerRegistrationDisplay(null,null,date).stage).toBe("NOT_INVITED");
    expect(resolveLearnerRegistrationDisplay({
      invitedAt:date,finishedAt:null,deadline:new Date("2026-10-17T18:29:59.999Z"),
    },null,date).stage).toBe("OPEN");
    expect(resolveLearnerRegistrationDisplay({
      invitedAt:date,finishedAt:null,deadline:date,
    },null,date).stage).toBe("CLOSED");
    expect(resolveLearnerRegistrationDisplay({
      invitedAt:date,finishedAt:date,deadline:null,
    },"HIGHER_STUDIES",date).stage).toBe("FINISHED");
  });
  it("never trusts unknown registration choices",()=>{
    expect(resolveLearnerRegistrationDisplay(null,"SOMETHING_ELSE",date).choice).toBeNull();
  });
  it("matches the legacy choice, consent and action words",()=>{
    expect(learnerPlacementChoices.map(item=>item.label))
      .toEqual(["Placements","Higher studies","Not interested"]);
    expect(LEARNER_REGISTRATION_COPY.register).toBe("Register");
    expect(LEARNER_REGISTRATION_COPY.update).toBe("Save my new choice");
    expect(LEARNER_REGISTRATION_COPY.consent)
      .toBe("I agree to share my academic details, resume and contact details with the companies I apply to.");
    expect(LEARNER_REGISTRATION_COPY.notInvited)
      .toBe("Registration opens when the placement cell invites your batch. You'll get a notice.");
  });
});
