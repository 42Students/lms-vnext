import {describe,it,expect} from "vitest";
import {FACULTY_PROTOTYPE_NAV,facultyPrototypeSidebarActive} from
 "../../src/components/shell/faculty-prototype-navigation";
import {prototypeRoleSkinForPath} from
 "../../src/components/shell/prototype-role-skin-model";

describe("Faculty prototype navigation",()=>{
 it("matches the four reference destinations",()=>{
  expect(FACULTY_PROTOTYPE_NAV.map(x=>x.label)).toEqual([
   "Today","Courses","Assignments & quizzes","Class schedule",
  ]);
 });
 it("keeps assessment subroutes highlighted and course details in Courses",()=>{
  expect(facultyPrototypeSidebarActive("/teacher/report/quiz/id","/teacher/assessments")).toBe(true);
  expect(facultyPrototypeSidebarActive("/teacher/courses/id/students","/teacher/courses")).toBe(true);
  expect(facultyPrototypeSidebarActive("/teacher","/teacher/courses")).toBe(false);
 });
 it("never presents a faculty skin without the faculty grant",()=>{
  const base={pathname:"/teacher",mentorEnabled:false,tpoEnabled:false,recruiterEnabled:false};
  expect(prototypeRoleSkinForPath({...base,facultyEnabled:false})).toBeNull();
  expect(prototypeRoleSkinForPath({...base,facultyEnabled:true})).toBe("faculty");
 });
});
