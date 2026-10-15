import {describe,expect,it} from "vitest";
import {facultyLiveMutationSuccess} from "@/modules/courses/faculty-live-success";
describe("Faculty live schedule mutation feedback",()=>{
 it("communicates each confirmed lifecycle event",()=>{
  expect(facultyLiveMutationSuccess("CREATE")).toContain("scheduled");
  expect(facultyLiveMutationSuccess("EDIT")).toContain("updated");
  expect(facultyLiveMutationSuccess("CANCEL")).toContain("cancelled");
 });
});
