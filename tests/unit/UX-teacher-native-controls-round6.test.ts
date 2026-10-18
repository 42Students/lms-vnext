import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)",path,"page.tsx"),"utf8");
function assertNativeControls(route:string){
 const source=read(route);
 for(const match of source.matchAll(/<(input|select|textarea)\b[^>]*>/g)){
  if(/\btype="hidden"/.test(match[0]))continue;
  const classes=match[0].match(/className="([^"]+)"/)?.[1];
  if(!classes)continue;
  expect(classes, route+" native field must have 16px phone typography").toContain("text-base");
  expect(classes, route+" native field needs visible keyboard focus").toContain("focus-visible:outline-2");
 }
 for(const match of source.matchAll(/<Link\b[^>]*>/g)){
  const classes=match[0].match(/className="([^"]+)"/)?.[1];
  if(!classes)continue;
  expect(classes, route+" link needs visible keyboard focus").toContain("focus-visible:outline-2");
 }
}
describe("Faculty reporting native control UX",()=>{
 it("UX-teacher-report-assignment-contentId-submissions-02 keeps readable phone fields and visible link focus",()=>assertNativeControls("teacher/report/assignment/[contentId]/submissions"));
 it("UX-teacher-report-quiz-quizId-attempts-02 keeps readable phone fields and visible link focus",()=>assertNativeControls("teacher/report/quiz/[quizId]/attempts"));
 it("UX-teacher-response-followups-02 keeps readable phone fields and visible link focus",()=>assertNativeControls("teacher/response-followups"));
 it("UX-teacher-results-02 keeps readable phone fields and visible link focus",()=>assertNativeControls("teacher/results"));
 it("UX-teach-courses-deliveryId-02 keeps readable phone fields and visible link focus",()=>assertNativeControls("teach/courses/[deliveryId]"));
});
