import {describe,expect,it} from "vitest";
import {facultyLiveSessionOption} from "@/modules/courses/faculty-live-session-option";
describe("Faculty live class selection disambiguation",()=>{
 it("includes course and Section even when meetings share names",()=>{
  const base={title:"Weekly review",courseName:"Mathematics"};
  const a=facultyLiveSessionOption({...base,sectionName:"A"});
  const b=facultyLiveSessionOption({...base,sectionName:"B"});
  expect(a).toContain("Mathematics · A");
  expect(b).toContain("Mathematics · B");
  expect(a).not.toBe(b);
 });
});
