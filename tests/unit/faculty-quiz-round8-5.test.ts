import {it,expect} from "vitest";
import {facultyQuizReviewIssues} from "@/modules/courses/faculty-quiz-builder-model";
const q=(points:number)=>({type:"SINGLE_CHOICE" as const,prompt:"Question",points,sequence:0,
 options:[{text:"Yes",correct:true,sequence:0},{text:"No",correct:false,sequence:1}]});
it("reports invalid questions and the overall points ceiling",()=>{
 expect(facultyQuizReviewIssues([q(1)])).toEqual({invalidQuestions:0,totalPoints:1,overLimit:false});
 expect(facultyQuizReviewIssues([{...q(1),prompt:""}]).invalidQuestions).toBe(1);
 expect(facultyQuizReviewIssues([q(1000),q(1000)]).overLimit).toBe(false);
 expect(facultyQuizReviewIssues([q(1000),q(9999)]).overLimit).toBe(true);
});
