import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
/** The legacy 14px desktop font is preserved through shared controls while
 * authoring pages opt into 16px on phones to prevent native picker zoom. */
const pages=[
 ["UX-teacher-native-font-shared-01","src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx"],
 ["UX-teacher-native-font-shared-02","src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page.tsx"],
 ["UX-teacher-native-font-shared-03","src/app/(authenticated)/teacher/response-followups/page.tsx"],
 ["UX-teacher-native-font-shared-04","src/app/(authenticated)/teacher/results/page.tsx"],
 ["UX-teacher-native-font-shared-05","src/components/courses/faculty-course-list.tsx"],
] as const;
describe("Faculty reporter and shared control font size",()=>{
 it.each(pages)("%s uses shared controls with mobile-safe 16px and touch targets",(_id,path)=>{
  const source=read(path);
  expect(source).toMatch(/<(?:Input|Select)\b/);
  expect(source).toContain("max-[767px]:text-[16px]");
  expect(source).toContain("min-h-11");
  for(const control of source.matchAll(/<(?:Input|Select|Textarea)\b[^>]*>/g)){
   const classes=control[0].match(/className="([^"]+)"/)?.[1]??"";
   expect(classes).not.toMatch(/\bmax-\[767px\]:text-xs\b/);
  }
 });
 it("shared Select retains native mobile font and keyboard semantics",()=>{
  const select=read("src/components/ui/select.tsx");
  expect(select).toContain('max-[767px]:text-[16px]');
  expect(select).toContain('<select');
 });
});
