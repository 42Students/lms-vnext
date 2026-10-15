import {it,expect} from "vitest";
import {facultyQuizQuestionRemovalPrompt} from "@/modules/courses/faculty-quiz-builder-model";
it("identifies the deleted question and strips multiline input",()=>{
 const p=facultyQuizQuestionRemovalPrompt(5,"  The longest\nquestion?  ");
 expect(p).toContain("question 6");
 expect(p).toContain("The longest question?");
 expect(p).not.toContain("\n");
 expect(facultyQuizQuestionRemovalPrompt(0,"")).toContain("question 1");
});