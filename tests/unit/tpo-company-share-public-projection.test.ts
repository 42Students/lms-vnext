import {describe,expect,it} from "vitest";
import {projectRecruiterVisibleShortlist} from "@/modules/placements/tpo-shareable-shortlist-model";
describe("public applicant capability projection",()=>{
 it("emits only the same three fields as TPO share-preview",()=>{
  const [result]=projectRecruiterVisibleShortlist([{
   applicationId:"app1",displayName:"Learner",email:"learner@example.com",
   phone:"never-shared",resumeUrl:"never-shared",privateNotes:"never-shared",
  }]);
  expect(result).toEqual({
   applicationId:"app1",displayName:"Learner",email:"learner@example.com",
  });
  expect(Object.keys(result)).toEqual(["applicationId","displayName","email"]);
 });
});
