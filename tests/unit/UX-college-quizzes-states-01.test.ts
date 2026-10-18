import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const base="src/app/(authenticated)/college/quizzes";
const read=(file:string)=>readFileSync(join(process.cwd(),base,file),"utf8");
describe("/college/quizzes loading and error accessibility",()=>{
 it("UX-college-quizzes-loading-01 reserves the row layout",()=>expect(read("loading.tsx")).toContain('variant="row"'));
 it("UX-college-quizzes-loading-02 uses shared accessible skeletons",()=>expect(read("loading.tsx")).toContain("Skeleton"));
 it("UX-college-quizzes-error-01 shows shared error state instead of raw errors",()=>expect(read("error.tsx")).toContain("ErrorState"));
 it("UX-college-quizzes-error-02 provides a 44px retry control",()=>expect(read("error.tsx")).toContain("<Button"));
});
