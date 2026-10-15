import {it,expect} from "vitest";
import {facultyProfileSaveFailure} from "@/modules/people/faculty-profile-error-model";
it("distinguishes transient service responses from validation errors",()=>{
 for(const status of [502,503,504]){
  expect(facultyProfileSaveFailure(undefined,status)).toMatch(/temporarily unavailable/);
  expect(facultyProfileSaveFailure(undefined,status)).toMatch(/verify the latest/);
 }
});
