import {describe,expect,it,vi} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {FacultyCourseTabNavigation} from "@/components/courses/faculty-course-tab-navigation";
import {legacyFacultyCourseRouteIntent,facultyCourseTabHref,facultyCourseTabs} from "@/modules/courses/faculty-course-navigation";
vi.mock("next/navigation",()=>({
 usePathname:()=>"/teacher/courses/55555555-5555-4555-8555-555555555555/blueprint",
 useRouter:()=>({push:vi.fn(),replace:vi.fn(),refresh:vi.fn()}),
}));
const first="55555555-5555-4555-8555-555555555555";
const second="66666666-6666-4666-8666-666666666666";
const html=()=>renderToStaticMarkup(createElement(FacultyCourseTabNavigation,{
 deliveryId:first,courseName:"Discrete Mathematics",sectionName:"Section A",
 teachingSections:[
  {deliveryId:first,label:"Section A",legacyClassId:21},
  {deliveryId:second,label:"Section B",legacyClassId:22},
 ],
}));
describe("Faculty course/class chooser acceptance",()=>{
 it("shows class chooser even from Blueprint, not only Students and Attendance",()=>{
  const output=html();
  expect(output).toContain("Select class for Blueprint");
  expect(output).toContain("Section A");
  expect(output).toContain("Section B");
  expect(output).toContain('value="'+first+'"');
  expect(output).toContain('value="'+second+'"');
  expect(output).toContain("Faculty course tabs");
 });
 it("keeps all five destinations pinned to the selected delivery",()=>{
  for(const tab of facultyCourseTabs)
   expect(facultyCourseTabHref(second,tab.path))
    .toContain("/teacher/courses/"+second+"/");
 });
 it("accepts bounded legacy course slugs/class hints but rejects traversal or duplicate ambiguity",()=>{
  expect(legacyFacultyCourseRouteIntent("CS-101",{cls:"22"})).toMatchObject({
   course:"CS-101",classHint:"22",preferCourse:false,
  });
  expect(legacyFacultyCourseRouteIntent("CS-101",{ref:"course"})).toMatchObject({preferCourse:true});
  for(const raw of ["../../learn","a/b","%00","a".repeat(161),""])
   expect(legacyFacultyCourseRouteIntent(raw,{})).toBeNull();
 });
});
