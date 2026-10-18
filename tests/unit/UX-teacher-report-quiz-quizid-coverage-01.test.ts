import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-report-quiz-quizid-01 /teacher/report/quiz/[quizId] keeps report scope and state contracts",()=>{
 const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx"),"utf8");
 expect(s).toContain("notFound()");
 expect(s).toContain("getCurrentRequestContext");
 expect(s).toContain("role=\"status\"");
 expect(s).toContain("aria-label=\"Quiz CSV response filters\"");
});
