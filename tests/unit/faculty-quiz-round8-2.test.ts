import {it,expect} from "vitest";
import {facultyQuizLoadedBankIssue} from "@/modules/courses/faculty-quiz-builder-model";
it("requires an explicit retry when a draft has no loaded questions",()=>{
 expect(facultyQuizLoadedBankIssue("DRAFT",0)).toMatch(/Retry/);
 expect(facultyQuizLoadedBankIssue("DRAFT",1)).toBeNull();
 expect(facultyQuizLoadedBankIssue("PUBLISHED",0)).toBeNull();
});
