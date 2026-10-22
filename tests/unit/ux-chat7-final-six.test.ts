import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("Signed-off UX rollout: learner, quiz, dashboard, notifications",()=>{
it("UX-learn-learn-projects-01 preserves real route and accessible states",()=>{
 const s=read("src/app/(authenticated)/learn/projects/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/projects/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/projects/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-projects-projectId-01 preserves real route and accessible states",()=>{
 const s=read("src/app/(authenticated)/learn/projects/[projectId]/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/projects/[projectId]/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/projects/[projectId]/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-quizzes-01 preserves real route and accessible states",()=>{
 const s=read("src/app/(authenticated)/learn/quizzes/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).toContain('redirect(');
 
 
 expect(read("src/app/(authenticated)/learn/quizzes/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/quizzes/error.tsx").length).toBeGreaterThan(0);
});
it("UX-quiz-quiz-01 preserves real route and accessible states",()=>{
 const s=read("src/app/quiz/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 expect(s).toContain('focus-visible:outline-[var(--lms-teal-deep)]');
 
 expect(read("src/app/quiz/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/quiz/error.tsx").length).toBeGreaterThan(0);
});
it("UX-dashboard-dashboard-01 preserves real route and accessible states",()=>{
 const s=read("src/app/(authenticated)/dashboard/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/dashboard/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/dashboard/error.tsx").length).toBeGreaterThan(0);
});
it("UX-notifications-notifications-01 preserves real route and accessible states",()=>{
 const s=read("src/app/(authenticated)/notifications/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/notifications/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/notifications/error.tsx").length).toBeGreaterThan(0);
});
});
