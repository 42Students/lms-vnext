import {z} from "zod";
import {createCourseQuizInputSchema} from "./quiz-validation";
import {authoringDueInstant} from "./faculty-authoring-datetime-model";

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
export function facultyChangeQuizChoiceType<
  T extends { correct: boolean },
  Q extends { type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE"; options: T[] },
>(
  question: Q,
  nextType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE",
): Q {
  if (nextType === "MULTIPLE_CHOICE") {
    return { ...question, type: nextType } as Q;
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
 const correct=question.options.filter(option=>option.correct).length;
 // Multi-choice requires at least one selected and one unselected option.
 if(!checked && question.options[index]?.correct && correct===1)
  return [...question.options];
 if(checked && !question.options[index]?.correct && correct===question.options.length-1)
  return [...question.options];
 return question.options.map((option,i)=>i===index?{...option,correct:checked}:option);
}

/** Removing a correct option cannot leave a single-choice question without a
 * valid answer. At least two choices must remain. */
export function facultyRemoveQuizOption<T extends {correct:boolean}>(
 question:{type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE";options:readonly T[]},
 index:number,
):T[]{
 if(question.options.length<=2 || index<0 || index>=question.options.length)
  return [...question.options];
 const remaining=question.options.filter((_,i)=>i!==index).map(o=>({...o}));
 if(question.type==="SINGLE_CHOICE"&&!remaining.some(o=>o.correct))
  remaining[0]!.correct=true;
 if(question.type==="MULTIPLE_CHOICE"){
  const selected=remaining.filter(option=>option.correct).length;
  if(selected===0)remaining[0]!.correct=true;
  if(selected===remaining.length)remaining[remaining.length-1]!.correct=false;
 }
 return remaining;
}

/** A confirmation applies to the exact metadata the Faculty member reviewed. */
export function facultyQuizConfirmationAfterEdit<T>(
 confirmed:boolean,previous:T,next:T,
):boolean {
 return Object.is(previous,next)?confirmed:false;
}

export function facultyRemoveQuizQuestion<T>(rows:readonly T[],index:number):T[]{
 if(rows.length<=1||index<0||index>=rows.length)return [...rows];
 return rows.filter((_,i)=>i!==index);
}
export function facultyAppendQuizQuestion<T>(rows:readonly T[],question:T):T[]{
 return rows.length>=100?[...rows]:[...rows,question];
}

/** Never publish a draft when its question bank could not be loaded. */
export function facultyQuizDraftLoadAllowsAction(
 failed:boolean,status:string|undefined,
 action:"CREATE"|"EDIT"|"PUBLISH"|"CLOSE"|"ARCHIVE",
):boolean {
 return !(failed&&status==="DRAFT"&&(action==="EDIT"||action==="PUBLISH"));
}

/** Validate the complete editable Quiz metadata before asking for confirmation. */
export function facultyQuizMetadataIssue(
 title:string,description:string,dueAt:string,maxAttempts:number,
):string|null {
 if(!title.trim()||title.trim().length>255)return "Enter a Quiz title (up to 255 characters).";
 if(description.trim().length>10000)return "Instructions are too long.";
 if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>20)
  return "Maximum attempts must be a whole number between 1 and 20.";
 try {authoringDueInstant(dueAt);}
 catch {return "Choose a valid due date in IST.";}
 return null;
}

/** Turn the API's typed Quiz errors into user-safe, actionable messages. */
export function facultyQuizWriteMessage(raw:unknown):string {
 const code=raw&&typeof raw==="object"&&"error" in raw&&typeof raw.error==="string"
  ?raw.error:"";
 switch(code){
  case "FACULTY_QUIZ_NO_CHANGE":return "No Quiz metadata changed. Update a field before saving.";
  case "FACULTY_QUIZ_STALE_VERSION":return "This Quiz changed elsewhere. Reload before retrying.";
  case "QUIZ_HAS_ATTEMPTS":return "Existing learner attempts seal questions and attempt limits.";
  case "INVALID_QUIZ_TRANSITION":return "This Quiz state no longer permits that action. Reload first.";
  case "QUIZ_DEADLINE_PASSED":return "Extend the deadline before publishing.";
  case "QUIZ_NAME_CONFLICT":return "Choose a different Quiz title for this Section.";
  case "FACULTY_TEACHING_SCOPE_REQUIRED":
  case "LEARNING_ACCESS_DENIED":
  case "QUIZ_NOT_FOUND":return "This teaching Section is no longer available to your account.";
  default:return "Quiz write was rejected. Review changes or retry.";
 }
}

/** Failed Section question fetches need an explicit retry without changing scope. */
export function facultyQuizCanRetryDetails(
 failed:boolean,quizId:string|undefined,pending:boolean,
):boolean {
 return failed && Boolean(quizId) && !pending;
}

/** Publishing must reflect the persisted, reviewed question bank, not dirty UI state. */
export function facultyQuizCanPublishSavedDraft(
 status:string|undefined,unsaved:boolean,loadFailed:boolean,
):boolean {
 return status==="DRAFT" && !unsaved && !loadFailed;
}
