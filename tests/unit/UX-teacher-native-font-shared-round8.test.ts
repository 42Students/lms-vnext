import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("Faculty reporter and shared control font size",()=>{
 it("UX-teacher-native-font-shared-01 keeps 16px text in interactive fields",()=>{
  const s=read("src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx");let checked=0;
  for(const m of s.matchAll(/<(?:input|select|textarea|Input|Select|Textarea)\b[^>]*>/g)){
   if(m[0].includes('type="hidden"'))continue;
   const classes=m[0].match(/className="([^"]+)"/)?.[1]??"";
   if(!classes.includes("text-base"))continue;
   checked++;expect(classes).not.toMatch(/\bsm:text-sm\b/);
  }
  expect(checked).toBeGreaterThan(0);
 });
 it("UX-teacher-native-font-shared-02 keeps 16px text in interactive fields",()=>{
  const s=read("src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page.tsx");let checked=0;
  for(const m of s.matchAll(/<(?:input|select|textarea|Input|Select|Textarea)\b[^>]*>/g)){
   if(m[0].includes('type="hidden"'))continue;
   const classes=m[0].match(/className="([^"]+)"/)?.[1]??"";
   if(!classes.includes("text-base"))continue;
   checked++;expect(classes).not.toMatch(/\bsm:text-sm\b/);
  }
  expect(checked).toBeGreaterThan(0);
 });
 it("UX-teacher-native-font-shared-03 keeps 16px text in interactive fields",()=>{
  const s=read("src/app/(authenticated)/teacher/response-followups/page.tsx");let checked=0;
  for(const m of s.matchAll(/<(?:input|select|textarea|Input|Select|Textarea)\b[^>]*>/g)){
   if(m[0].includes('type="hidden"'))continue;
   const classes=m[0].match(/className="([^"]+)"/)?.[1]??"";
   if(!classes.includes("text-base"))continue;
   checked++;expect(classes).not.toMatch(/\bsm:text-sm\b/);
  }
  expect(checked).toBeGreaterThan(0);
 });
 it("UX-teacher-native-font-shared-04 keeps 16px text in interactive fields",()=>{
  const s=read("src/app/(authenticated)/teacher/results/page.tsx");let checked=0;
  for(const m of s.matchAll(/<(?:input|select|textarea|Input|Select|Textarea)\b[^>]*>/g)){
   if(m[0].includes('type="hidden"'))continue;
   const classes=m[0].match(/className="([^"]+)"/)?.[1]??"";
   if(!classes.includes("text-base"))continue;
   checked++;expect(classes).not.toMatch(/\bsm:text-sm\b/);
  }
  expect(checked).toBeGreaterThan(0);
 });
 it("UX-teacher-native-font-shared-05 keeps 16px text in interactive fields",()=>{
  const s=read("src/components/courses/faculty-course-list.tsx");let checked=0;
  for(const m of s.matchAll(/<(?:input|select|textarea|Input|Select|Textarea)\b[^>]*>/g)){
   if(m[0].includes('type="hidden"'))continue;
   const classes=m[0].match(/className="([^"]+)"/)?.[1]??"";
   if(!classes.includes("text-base"))continue;
   checked++;expect(classes).not.toMatch(/\bsm:text-sm\b/);
  }
  expect(checked).toBeGreaterThan(0);
 });
});
