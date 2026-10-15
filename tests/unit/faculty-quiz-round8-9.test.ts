import {it,expect} from "vitest";
import {facultyQuizOptionRemovalPrompt} from "@/modules/courses/faculty-quiz-builder-model";
it("distinguishes single and multi-answer option removal",()=>{
 const rows=[{correct:true},{correct:true},{correct:false}];
 expect(facultyQuizOptionRemovalPrompt("SINGLE_CHOICE",rows,0,0)).toMatch(/remaining choice/);
 expect(facultyQuizOptionRemovalPrompt("MULTIPLE_CHOICE",rows,1,1)).toMatch(/Other marked/);
 expect(facultyQuizOptionRemovalPrompt("MULTIPLE_CHOICE",[{correct:true},{correct:false}],0,0)).toMatch(/remaining choice/);
});
