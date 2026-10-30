import {describe,expect,it,vi} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {FacultyPrototypeBlueprint} from "@/components/courses/faculty-prototype-blueprint";

vi.mock("next/navigation",()=>({
 useRouter:()=>({refresh:vi.fn(),replace:vi.fn(),push:vi.fn()}),
}));
const course={
 deliveryId:"55555555-5555-4555-8555-555555555555",
 sectionName:"Section A",
};
type Workspace=Parameters<typeof FacultyPrototypeBlueprint>[0]["workspace"];
const asWorkspace=(lessons:unknown[],status="PUBLISHED")=>({
 course,lessons,learningPath:{status},
}) as unknown as Workspace;
function html(lessons:unknown[],status="PUBLISHED"){
 return renderToStaticMarkup(createElement(FacultyPrototypeBlueprint,{
  workspace:asWorkspace(lessons,status),
  selectedLessonId:null,
 }));
}
describe("Faculty Blueprint honest empty and partial-source states",()=>{
 it("does not invent a lesson or allow course-wide lesson mutation on empty syllabus",()=>{
  const output=html([]);
  expect(output).toContain("0 lessons");
  expect(output).toContain("No lessons in the current learning path");
  expect(output).toContain("Ask your college admin to add one");
  expect(output).toContain("No lesson selected");
  expect(output).not.toContain("Upload New Video");
  expect(output).not.toContain("No enrolled learners");
 });
 it("keeps an authorized empty Section lesson and six Section-specific creation destinations",()=>{
  const lesson={id:"66666666-6666-4666-8666-666666666666",name:"Matrices",
   visibleToStudents:true,contents:[],assignments:[],quizzes:[]};
  const output=html([lesson]);
  expect(output).toContain("1 lessons");
  expect(output).toContain("Matrices");
  expect(output).toContain("This lesson has no items yet");
  expect(output).toContain("Shared syllabus lessons are managed by your college");
  expect(output).toContain("Only the college admin can add shared syllabus lessons");
  for(const kind of ["VIDEO","YOUTUBE","RESOURCE","LIVE_CLASS"])
   expect(output).toContain("create="+kind);
  expect(output).toContain("/assignments/manage");
  expect(output).toContain("/quizzes/manage");
 });
 it("never reports an unpublished lesson as live or fabricates learner activity",()=>{
  const lesson={id:"66666666-6666-4666-8666-666666666666",name:"Matrices",
   visibleToStudents:false,contents:[],assignments:[],quizzes:[]};
  const output=html([lesson],"DRAFT");
  expect(output).toContain("Progress becomes available after this lesson is published");
  expect(output).toContain("Draft");
  expect(output).not.toContain("Recorded activity:");
 });
});
