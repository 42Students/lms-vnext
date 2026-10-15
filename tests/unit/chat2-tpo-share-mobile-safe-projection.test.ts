import {describe,it,expect} from "vitest";
import {projectRecruiterVisibleShortlist} from "../../src/modules/placements/tpo-shareable-shortlist-model";
describe("mobile internal recruiter shortlist projection",()=>{
 it("shares no phone, notes, resume or scores from raw rows",()=>{
  const input=[{applicationId:"app",displayName:"Learner",email:"person@example.test",phone:"secret",resumeUrl:"secret",internalNotes:"secret",score:99}];
  const view=projectRecruiterVisibleShortlist(input);
  expect(view).toEqual([{applicationId:"app",displayName:"Learner",email:"person@example.test"}]);
 });
});
