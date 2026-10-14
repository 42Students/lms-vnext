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

/** Switching a multiselect question to single choice must not retain multiple
 * marked answers; ensure a defined answer even in an incomplete draft. */
export function facultyChangeQuizChoiceType<T extends { correct: boolean }>(
  question: { type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE"; options: T[] },
  nextType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE",
) {
  if (nextType === "MULTIPLE_CHOICE") {
    return { ...question, type: nextType };
  }
  const firstCorrect = question.options.findIndex((option) => option.correct);
  const chosen = firstCorrect === -1 ? 0 : firstCorrect;
  return {
    ...question,
    type: nextType,
    options: question.options.map((option, index) => ({
      ...option,
      correct: index === chosen,
    })),
  };
}

/** Publishing or closing seals the authoring fields even before a refresh. */
export function facultyQuizDraftEditable(status: string | null | undefined): boolean {
  return status == null || status === "DRAFT";
}

/** The API accepts title/instructions/due-date updates after publication,
 * but the question bank and attempt limit are sealed. */
export function facultyQuizMetadataEditable(status: string | null | undefined): boolean {
  return status == null || status === "DRAFT" || status === "PUBLISHED" || status === "CLOSED";
}

/** Keep exactly one correct option in single-choice mode while editing.
 * Reject clearing the last answer instead of leaving a draft in an invalid state. */
export function facultyToggleQuizAnswer<T extends {correct:boolean}>(
 question:{type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE";options:readonly T[]},
 index:number,checked:boolean,
):T[]{
 if(index<0||index>=question.options.length)return [...question.options];
 if(question.type==="SINGLE_CHOICE"){
  if(!checked)return [...question.options];
  return question.options.map((option,i)=>({...option,correct:i===index}));
 }
 return question.options.map((option,i)=>i===index?{...option,correct:checked}:option);
}
