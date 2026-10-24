import {describe,expect,it} from "vitest";
import {mentorCalendarCanMutateMeeting as mayEdit} from
 "@/modules/projects/mentor-calendar-mutation-access-model";
const active={memberRole:"MENTOR",roleKind:"MENTOR",
 canMutate:true,projectStatus:"ACTIVE"};
describe("Mentor calendar secondary assignment policy",()=>{
 it("allows writable primary and co-mentor",()=>{
  expect(mayEdit(active)).toBe(true);
  expect(mayEdit({...active,roleKind:"CO_MENTOR"})).toBe(true);
 });
 it("denies read-only guides, reviewers and revoked grants",()=>{
  expect(mayEdit({...active,roleKind:"OBSERVER"})).toBe(false);
  expect(mayEdit({...active,roleKind:"REVIEWER"})).toBe(false);
  expect(mayEdit({...active,canMutate:false})).toBe(false);
  expect(mayEdit({...active,memberRole:"LEARNER"})).toBe(false);
 });
 it("blocks edit controls in planned, completed and archived projects",()=>{
  for(const projectStatus of ["PLANNED","COMPLETED","ARCHIVED"])
   expect(mayEdit({...active,projectStatus})).toBe(false);
 });
});
