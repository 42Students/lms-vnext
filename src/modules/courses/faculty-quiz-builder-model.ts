import {z} from "zod";
import {createCourseQuizInputSchema} from "./quiz-validation";

const item=z.object({
 type:z.enum(["SINGLE_CHOICE","MULTIPLE_CHOICE"]),
 prompt:z.string(),
 points:z.number(),
 sequence:z.number(),
 options:z.array(z.object({
  text:z.string(),correct:z.boolean().optional(),sequence:z.number(),
 }).passthrough()),
}).passthrough();
const detailSchema=z.object({quiz:z.object({questions:z.array(item)}).passthrough()}).passthrough();

/** GET /api/courses/quizzes/[id] returns {quiz:{quiz,questions,...}}, not root questions. */
export function facultyAuthoringQuestionsFromResponse(input:unknown){
 const parsed=detailSchema.parse(input);
 return parsed.quiz.questions.map((q,i)=>({
  type:q.type,prompt:q.prompt,points:q.points,sequence:i,
  options:q.options.map((option,j)=>({
   text:option.text,correct:option.correct??false,sequence:j,
  })),
 }));
}
export function facultyQuizDraftIssue(
 title:string,
 questions:readonly {type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE";prompt:string;
  points:number;sequence:number;options:readonly {
    text:string;correct:boolean;sequence:number;
  }[]}[],
):string|null{
 if(!title.trim())return "Enter a Quiz title.";
 const normalized=questions.map((q,i)=>({...q,sequence:i,
   options:q.options.map((o,j)=>({...o,sequence:j}))}));
 const valid=createCourseQuizInputSchema.shape.questions.safeParse(normalized);
 return valid.success?null:(valid.error.issues[0]?.message??"Review question options and points.");
}
