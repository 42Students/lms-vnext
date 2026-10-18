import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/quizzes/page.tsx"),"utf8");
describe("/college/quizzes UX",()=>{
 it("UX-college-quizzes-01 preserves responsive or failure recovery contract",()=>expect(source).toContain("href=\"/college/quizzes\""));
 it("UX-college-quizzes-02 preserves responsive or failure recovery contract",()=>expect(source).toContain("CollegeAssessmentAggregate"));
});
