import {beforeEach,describe,expect,it,vi} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {FacultyPrototypeCourseDirectory} from "@/components/courses/faculty-prototype-course-directory";
import {facultyCourseListQuerySchema,pageFacultyCourseList,parseFacultyCourseListLocation} from "@/modules/courses/faculty-course-list-model";
import type {FacultyCourseListRow} from "@/components/courses/faculty-course-list";

const IDs={
 courseA:"11111111-1111-4111-8111-111111111111",
 courseB:"22222222-2222-4222-8222-222222222222",
 periodA:"33333333-3333-4333-8333-333333333333",
 periodB:"44444444-4444-4444-8444-444444444444",
 deliveryA:"55555555-5555-4555-8555-555555555555",
 deliveryB:"66666666-6666-4666-8666-666666666666",
 deliveryC:"77777777-7777-4777-8777-777777777777",
};
function row(deliveryId:string,courseId:string,academicPeriodId:string,
 sectionName:string,courseName:string):FacultyCourseListRow{
 return {
  course:{
   deliveryId,courseId,academicPeriodId,sectionName,courseName,
   courseCode:courseId===IDs.courseA?"CS101":"CS205",credits:4,
   offeringType:"CORE",sectionId:deliveryId,sectionCode:sectionName,
   academicPeriodName:academicPeriodId===IDs.periodA?"Semester 1":"Semester 2",
   academicPeriodCode:"2026",teachingRole:"PRIMARY",
  },
  workspace:{
   learningPath:null,
   summary:{lessons:0,contents:1,assignments:0,quizzes:0,draftItems:0,publishedItems:1},
  },
  thumbnailUrl:null,
 } as unknown as FacultyCourseListRow;
}
const rows=[
 row(IDs.deliveryA,IDs.courseA,IDs.periodA,"Section A","Advanced Algorithms"),
 row(IDs.deliveryB,IDs.courseA,IDs.periodA,"Section B","Advanced Algorithms"),
 row(IDs.deliveryC,IDs.courseB,IDs.periodB,"Section C","Operating Systems"),
];
const markup=(data=rows)=>renderToStaticMarkup(createElement(FacultyPrototypeCourseDirectory,{
 rows:data,totalAssignments:data.length,
 pendingByDelivery:{},attendanceByDelivery:{},
}));
describe("Faculty Courses list closure",()=>{
 it("starts with all authorized periods, not the first period only",()=>{
  const html=markup();
  expect(html).toContain("2 courses");
  expect(html).toContain("across periods");
  expect(html).toContain("Advanced Algorithms");
  expect(html).toContain("Operating Systems");
  expect(html).toContain("3 classes");
 });
 it("does not silently open the first Section of multi-class courses",()=>{
  const html=markup();
  expect(html).toContain("Choose class");
  expect(html).toContain("Select a class to view attendance");
  expect(html).toContain("Section A");
  expect(html).toContain("Section B");
  expect(html).toContain("/teacher/courses/"+IDs.deliveryA+"/home");
  expect(html).toContain("/teacher/courses/"+IDs.deliveryB+"/home");
  expect(html).not.toContain("/teacher/courses/"+IDs.deliveryA+"/attendanceDetail");
  expect(html).not.toContain("/teacher/courses/"+IDs.deliveryB+"/attendanceDetail");
  expect(html).toContain("/teacher/courses/"+IDs.deliveryC+"/attendanceDetail");
 });
 it("shows honest no-assignment state without fabricating any link",()=>{
  const html=markup([]);
  expect(html).toContain("No teaching assignments found");
  expect(html).toContain("administrator assigns you a class");
  expect(html).not.toContain("/teacher/courses/"+IDs.deliveryA+"/home");
 });
 it("rejects forged filters, duplicate selectors and invalid pagination before scope lookup",()=>{
  for(const raw of [{collegeId:IDs.periodB},{q:["a","b"]},
    {section:IDs.courseA,page:"0"},{period:"bad"},{role:"ADMIN"},
    {page:"1e2"},{page:["1"]}]){
   expect(parseFacultyCourseListLocation(raw)).toBeNull();
  }
 });
 it("keeps distinct Section destinations and cumulative page windows",()=>{
  const assigned=Array.from({length:144},(_,i)=>({
   ...rows[i%3]!.course,
   deliveryId:"delivery-"+i,sectionId:"section-"+i,
  }));
  const second=pageFacultyCourseList(assigned,facultyCourseListQuerySchema.parse({page:2}));
  const third=pageFacultyCourseList(assigned,facultyCourseListQuerySchema.parse({page:3}));
  expect(second.items).toHaveLength(96);
  expect(third.items).toHaveLength(144);
  expect(new Set(third.items.map(row=>row.deliveryId)).size).toBe(144);
 });
});
