import {describe,expect,it} from "vitest";
import {facultyLiveConfirmText} from "@/modules/courses/faculty-live-confirmation";
describe("Faculty Blueprint destructive confirmation",()=>{
 it("names course and Section for cancel and never exposes meeting URL",()=>{
  const session={title:"Seminar",courseName:"Physics",sectionName:"B"};
  const label=facultyLiveConfirmText("CANCEL",session,"");
  expect(label).toContain("Physics · B");
  expect(label).toContain("no longer appear");
  expect(label).not.toContain("meet.");
 });
 it("names lesson for create and exact session for edit",()=>{
  expect(facultyLiveConfirmText("CREATE",undefined,"Unit 1")).toContain("Unit 1");
  expect(facultyLiveConfirmText("EDIT",{title:"Lecture",courseName:"Math",sectionName:"A"},"")).toContain("Lecture");
 });
});
