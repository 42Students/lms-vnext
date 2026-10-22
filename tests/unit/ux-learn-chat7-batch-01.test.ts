import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("UX learner route batch 1",()=>{
it("UX-learn-learn-01 maintains source and route boundaries",()=>{
 const source=read("src/app/(authenticated)/learn/page.tsx");
 expect(source.length).toBeGreaterThan(0);
 expect(source).toContain('redirect(');
 
 
 expect(read("src/app/(authenticated)/learn/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-allAssignments-01 maintains source and route boundaries",()=>{
 const source=read("src/app/(authenticated)/learn/allAssignments/page.tsx");
 expect(source.length).toBeGreaterThan(0);
 expect(source).not.toContain('text-[#26bac7]');
 
 expect(source).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/allAssignments/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/allAssignments/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-allAssignments-assignmentId-01 maintains source and route boundaries",()=>{
 const source=read("src/app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx");
 expect(source.length).toBeGreaterThan(0);
 expect(source).not.toContain('text-[#26bac7]');
 
 expect(source).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/allAssignments/[assignmentId]/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/allAssignments/[assignmentId]/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-allQuizzes-01 maintains source and route boundaries",()=>{
 const source=read("src/app/(authenticated)/learn/allQuizzes/page.tsx");
 expect(source.length).toBeGreaterThan(0);
 expect(source).not.toContain('text-[#26bac7]');
 
 expect(source).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/allQuizzes/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/allQuizzes/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-allQuizzes-quizId-01 maintains source and route boundaries",()=>{
 const source=read("src/app/(authenticated)/learn/allQuizzes/[quizId]/page.tsx");
 expect(source.length).toBeGreaterThan(0);
 expect(source).not.toContain('text-[#26bac7]');
 expect(source).toContain('text-[var(--lms-teal-deep)]');
 expect(source).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/allQuizzes/[quizId]/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/allQuizzes/[quizId]/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-assignments-01 maintains source and route boundaries",()=>{
 const source=read("src/app/(authenticated)/learn/assignments/page.tsx");
 expect(source.length).toBeGreaterThan(0);
 expect(source).toContain('redirect(');
 
 
 expect(read("src/app/(authenticated)/learn/assignments/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/assignments/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-attendance-01 maintains source and route boundaries",()=>{
 const source=read("src/app/(authenticated)/learn/attendance/page.tsx");
 expect(source.length).toBeGreaterThan(0);
 expect(source).not.toContain('text-[#26bac7]');
 expect(source).toContain('text-[var(--lms-teal-deep)]');
 expect(source).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/attendance/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/attendance/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-attendance-calendar-01 maintains source and route boundaries",()=>{
 const source=read("src/app/(authenticated)/learn/attendance/calendar/page.tsx");
 expect(source.length).toBeGreaterThan(0);
 expect(source).not.toContain('text-[#26bac7]');
 expect(source).toContain('text-[var(--lms-teal-deep)]');
 expect(source).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/attendance/calendar/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/attendance/calendar/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-calendar-01 maintains source and route boundaries",()=>{
 const source=read("src/app/(authenticated)/learn/calendar/page.tsx");
 expect(source.length).toBeGreaterThan(0);
 expect(source).not.toContain('text-[#26bac7]');
 expect(source).toContain('text-[var(--lms-teal-deep)]');
 expect(source).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/calendar/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/calendar/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-courses-01 maintains source and route boundaries",()=>{
 const source=read("src/app/(authenticated)/learn/courses/page.tsx");
 expect(source.length).toBeGreaterThan(0);
 expect(source).not.toContain('text-[#26bac7]');
 
 expect(source).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/courses/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/courses/error.tsx").length).toBeGreaterThan(0);
});
});
