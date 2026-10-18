import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
it("UX-teacher-courses-deliveryid-quizzes-manage-01 /teacher/courses/[deliveryId]/quizzes/manage keeps page scope and true states",()=>{
const s=readFileSync(join(process.cwd(),"src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/page.tsx"),"utf8");
expect(s).toContain("getCurrentRequestContext");
expect(s).toContain("<PageHeader eyebrow=\"Faculty · Courses\" title=\"Section quizzes\"");
expect(s).toContain("role=\"status\"");
});
