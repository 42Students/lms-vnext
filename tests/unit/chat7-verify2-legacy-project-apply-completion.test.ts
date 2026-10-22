import {describe,it,expect} from "vitest";
import {legacyLearnerProjectCard} from "@/modules/projects/legacy-workspace-projection";
import {legacyApplicationReapplyPolicy} from "@/modules/placements/learner-drive-apply-model";

describe("legacy learner summaries and application transition boundaries",()=>{
 it("preserves unknown mentor and progress instead of asserting completion",()=>{
  const row=legacyLearnerProjectCard({id:"one",title:"Project",status:"IN_PROGRESS"});
  expect(row).toMatchObject({course:null,mentor:null,phase:null,nextDue:null,
    progress:null,status:"ACTIVE",nextAction:null});
 });
 it("projects archived next actions as read only and maintains timestamps",()=>{
  const row=legacyLearnerProjectCard({id:"p",title:"Archive",status:"ARCHIVED",
    nextAction:"Write more",nextDueAt:new Date("2026-10-21T04:30:00Z")});
  expect(row.nextAction).toBeNull();
  expect(row.nextDue).toBe("2026-10-21T04:30:00.000Z");
 });
 it("never permits a withdrawn application to bypass screening and offer history",()=>{
  const source={legacyStatus:"WITHDRAWN",vNextStatus:"WITHDRAWN",
   hasScreening:false,hasRoundProgress:false,hasOffer:false,sameChannel:true};
  expect(legacyApplicationReapplyPolicy(source).canReapply).toBe(true);
  expect(legacyApplicationReapplyPolicy({...source,hasOffer:true}).canReapply).toBe(false);
  expect(legacyApplicationReapplyPolicy({...source,sameChannel:false}).canReapply).toBe(false);
 });
});
