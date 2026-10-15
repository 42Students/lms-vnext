import {it,expect} from "vitest";
import {facultyQuizReadErrorMessage} from "@/modules/courses/faculty-quiz-builder-model";
it("redacts arbitrary transport exceptions while preserving safe retry guidance",()=>{
 expect(facultyQuizReadErrorMessage(new Error("database password: secret"))).not.toContain("secret");
 expect(facultyQuizReadErrorMessage(new Error("Cannot load quiz questions for this Section."))).toMatch(/Section/);
 expect(facultyQuizReadErrorMessage({secret:"x"})).toMatch(/Retry/);
});
