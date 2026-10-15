import {it,expect} from "vitest";
import {facultyQuizReadyToPublish} from "@/modules/courses/faculty-quiz-builder-model";
const q={type:"SINGLE_CHOICE" as const,prompt:"Question",points:3,sequence:0,
 options:[{text:"Right",correct:true,sequence:0},{text:"Wrong",correct:false,sequence:1}]};
it("only permits publishing the complete and unchanged loaded draft",()=>{
 expect(facultyQuizReadyToPublish("DRAFT",false,false,[q])).toBe(true);
 expect(facultyQuizReadyToPublish("DRAFT",false,false,[])).toBe(false);
 expect(facultyQuizReadyToPublish("DRAFT",true,false,[q])).toBe(false);
 expect(facultyQuizReadyToPublish("DRAFT",false,true,[q])).toBe(false);
 expect(facultyQuizReadyToPublish("PUBLISHED",false,false,[q])).toBe(false);
 expect(facultyQuizReadyToPublish("DRAFT",false,false,[{...q,options:[q.options[0]!,{...q.options[1]!,correct:true}]}])).toBe(false);
});
