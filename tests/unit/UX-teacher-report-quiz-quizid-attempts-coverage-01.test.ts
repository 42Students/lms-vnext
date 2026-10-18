import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-report-quiz-quizid-attempts-01 /teacher/report/quiz/[quizId]/attempts keeps report scope and state contracts",()=>{
 const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page.tsx"),"utf8");
 expect(s).toContain("notFound()");
 expect(s).toContain("getCurrentRequestContext");
 expect(s).toContain("<PageHeader eyebrow=\"Faculty · Quiz Report\" title=\"Individual Quiz attempts\"");
 expect(s).toContain("<EmptyState title=\"No matching Quiz attempts\"");
});
