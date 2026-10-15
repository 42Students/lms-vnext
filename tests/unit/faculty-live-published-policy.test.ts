import {describe,expect,it} from "vitest";
import {facultyLivePublishedMutationAllowed} from "@/modules/courses/faculty-live-published-policy";
describe("Faculty live published-only mutation policy",()=>{
 it("allows published session edits and cancellations only",()=>{
  expect(facultyLivePublishedMutationAllowed("PUBLISHED")).toBe(true);
  for(const state of ["DRAFT","ARCHIVED","CLOSED",null,undefined]){
   expect(facultyLivePublishedMutationAllowed(state)).toBe(false);
  }
 });
});
