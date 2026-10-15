import {it,expect} from "vitest";
import {facultyQuizShouldDisplayQuestion} from "@/modules/courses/faculty-quiz-builder-model";
const q={type:"SINGLE_CHOICE" as const,prompt:"Bounded",points:2,sequence:0,
 options:[{text:"Yes",correct:true,sequence:0},{text:"No",correct:false,sequence:1}]};
it("filters only visual question cards, not the data to save",()=>{
 expect(facultyQuizShouldDisplayQuestion(q,0,"",true)).toBe(false);
 expect(facultyQuizShouldDisplayQuestion({...q,prompt:""},0,"",true)).toBe(true);
 expect(facultyQuizShouldDisplayQuestion(q,0,"Bounded",false)).toBe(true);
 expect(facultyQuizShouldDisplayQuestion(q,0,"Else",false)).toBe(false);
});
