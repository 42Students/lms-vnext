import {describe,expect,it} from "vitest";
import {mentorAtomicNextSprintEligible as eligible} from
 "@/modules/projects/mentor-atomic-next-sprint-model";
const valid={
 sourceSprintId:"source",targetSprintId:"target",
 sourceReleaseSequence:1,sourceSprintSequence:5,
 targetReleaseSequence:2,targetSprintSequence:0,
 targetSprintStatus:"PLANNED",targetReleaseStatus:"PLANNED",
 hasPrimaryMentor:true,hasAnotherActiveSprint:false,
};
describe("atomic Mentor sign-off and next Sprint start gate",()=>{
 it("permits a later release even when sprint numbering restarts at zero",()=>{
  expect(eligible(valid)).toBe(true);
  expect(eligible({...valid,targetReleaseStatus:"IN_PROGRESS"})).toBe(true);
 });
 it("rejects replayed target, nonplanned sprint and shipped releases",()=>{
  expect(eligible({...valid,targetSprintId:"source"})).toBe(false);
  expect(eligible({...valid,targetSprintStatus:"ACTIVE"})).toBe(false);
  expect(eligible({...valid,targetSprintStatus:"COMPLETED"})).toBe(false);
  expect(eligible({...valid,targetReleaseStatus:"SHIPPED"})).toBe(false);
 });
 it("rejects a missing current primary Mentor or competing active sprint",()=>{
  expect(eligible({...valid,hasPrimaryMentor:false})).toBe(false);
  expect(eligible({...valid,hasAnotherActiveSprint:true})).toBe(false);
 });
 it("rejects nonchronological targets across or within releases",()=>{
  expect(eligible({...valid,targetReleaseSequence:0})).toBe(false);
  expect(eligible({...valid,targetReleaseSequence:1,targetSprintSequence:5})).toBe(false);
  expect(eligible({...valid,targetReleaseSequence:1,targetSprintSequence:6})).toBe(true);
 });
});
