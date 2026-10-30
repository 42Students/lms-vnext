import {z} from "zod";
import {createCourseQuizInputSchema} from "./quiz-validation";
import {authoringDueInstant} from "./faculty-authoring-datetime-model";

const item=z.object({
 type:z.enum(["SINGLE_CHOICE","MULTIPLE_CHOICE"]),
 prompt:z.string(),
 points:z.number(),
 sequence:z.number(),
 options:z.array(z.object({
  id:z.string().uuid().optional(),text:z.string(),correct:z.boolean().optional(),sequence:z.number(),
 }).passthrough()),
}).passthrough();
const detailSchema=z.object({quiz:z.object({questions:z.array(item)}).passthrough()}).passthrough();

/** GET /api/courses/quizzes/[id] returns {quiz:{quiz,questions,...}}, not root questions. */
export function facultyAuthoringQuestionsFromResponse(input:unknown){
 const parsed=detailSchema.parse(input);
 return [...parsed.quiz.questions].sort((a,b)=>a.sequence-b.sequence).map((q,i)=>({
  type:q.type,prompt:q.prompt,points:q.points,sequence:i,
  options:[...q.options].sort((a,b)=>a.sequence-b.sequence).map((option,j)=>({
   id:option.id,text:option.text,correct:option.correct??false,sequence:j,
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
 if(!title.trim() || title.trim().length > 255)return "Enter a Quiz title (up to 255 characters).";
 if(questions.some(q=>!Number.isInteger(q.points)||q.points<1||q.points>100))
  return "Question points must be between 1 and 100.";
 const normalized=questions.map((q,i)=>({...q,sequence:i,
   options:q.options.map((o,j)=>({...o,sequence:j}))}));
 const valid=createCourseQuizInputSchema.shape.questions.safeParse(normalized);
 return valid.success?null:(valid.error.issues[0]?.message??"Review question options and points.");
}

/** Rehydrate author-only shuffle flags from the authenticated persisted Quiz.
 * The Section list can be stale or omit these columns; fail closed instead of
 * silently resetting a saved setting to false during the next draft edit. */
export function facultyQuizShuffleSettingsFromResponse(raw:unknown){
 const parsed=z.object({quiz:z.object({quiz:z.object({
  shuffleQuestions:z.boolean(),shuffleOptions:z.boolean(),
 }).passthrough()}).passthrough()}).passthrough().safeParse(raw);
 if(!parsed.success)
  throw new Error("Saved Quiz shuffle settings are unavailable. Reload before editing.");
 return {
  shuffleQuestions:parsed.data.quiz.quiz.shuffleQuestions,
  shuffleOptions:parsed.data.quiz.quiz.shuffleOptions,
 };
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
 return !(failed&&(status==="DRAFT"||status===undefined)&&(action==="EDIT"||action==="PUBLISH"));
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

/** POST returns an authoritative persisted Quiz revision. No optimistic guess
 * of the next version is safe because Postgres timestamps have precision. */
const savedQuizSchema=z.object({quiz:z.object({
 id:z.string().uuid(),lessonId:z.string().uuid(),
 title:z.string(),description:z.string().nullable(),dueAt:z.string().nullable(),
 maxAttempts:z.number().int(),sequence:z.number().int(),
 shuffleQuestions:z.boolean().optional(),shuffleOptions:z.boolean().optional(),
 status:z.enum(["DRAFT","PUBLISHED","CLOSED","ARCHIVED"]),
 updatedAt:z.iso.datetime({offset:true}),
})}).passthrough();
export function facultyQuizSavedFromCommand(raw:unknown){
 const result=savedQuizSchema.safeParse(raw);
 return result.success?result.data.quiz:null;
}
export function facultyQuizReconcileRows<T extends {id:string}>(
 existing:readonly T[],saved:T,
):T[]{
 return [saved,...existing.filter(row=>row.id!==saved.id)];
}

/** Keep authored question order stable until the next explicit user action. */
export function facultyMoveQuizQuestion<T>(rows:readonly T[],from:number,to:number):T[]{
 if(from<0||to<0||from>=rows.length||to>=rows.length||from===to)return [...rows];
 const next=[...rows];const [entry]=next.splice(from,1);next.splice(to,0,entry!);
 return next;
}

/** Move one answer option without changing the selected correctness flags. */
export function facultyMoveQuizOption<T>(options:readonly T[],from:number,to:number):T[]{
 return facultyMoveQuizQuestion(options,from,to);
}

/** A duplicate question has an independent option list and a sequence assigned at save. */
export function facultyDuplicateQuizQuestion<T extends {options:readonly object[]}>(rows:readonly T[],index:number):T[]{
 if(index<0||index>=rows.length||rows.length>=100)return [...rows];
 const original=rows[index]!;
 const clone={...original,options:original.options.map(option=>({...option}))} as T;
 const next=[...rows];next.splice(index+1,0,clone);return next;
}

/** A copied answer must never silently introduce a second correct answer. */
export function facultyDuplicateQuizOption<T extends {correct:boolean}>(options:readonly T[],index:number):T[]{
 if(index<0||index>=options.length||options.length>=20)return [...options];
 const original=options[index]!;
 const cloned={...original,correct:false};
 const next=[...options];next.splice(index+1,0,cloned);
 return next;
}

/** Switching quizzes while editing must not silently discard a draft. */
export function facultyQuizSwitchNeedsConfirmation(unsaved:boolean,fromId:string,toId:string):boolean {
 return unsaved&&fromId!==toId;
}

/** Synchronous write lock: React state updates only after the current event. */
export function facultyBeginQuizWrite(lock:{current:boolean}):boolean{
 if(lock.current)return false;
 lock.current=true;return true;
}

/** Preview only authorized unsaved question totals; do not publish on preview. */
export function facultyQuizDraftReview(questions:readonly {points:number;options:readonly {correct:boolean}[]}[]){
 return {questionCount:questions.length,
  optionCount:questions.reduce((sum,q)=>sum+q.options.length,0),
  totalPoints:questions.reduce((sum,q)=>sum+(Number.isFinite(q.points)?q.points:0),0),
  missingCorrect:questions.filter(q=>!q.options.some(o=>o.correct)).length};
}

/** Don't offer a metadata no-op as a real save (the API rejects it). */
export function facultyQuizCanSaveChanges(status:string|undefined,dirty:boolean,failed:boolean,pending:boolean){
 return !pending&&dirty&&(
  status==="PUBLISHED"||status==="CLOSED"||(status==="DRAFT"&&!failed));
}

/** Explicitly reload persisted values or clear the unsaved new Quiz. */
export function facultyQuizMayResetDraft(dirty:boolean,pending:boolean){
 return dirty&&!pending;
}

/** Copies a scoped instructor-readable Quiz only into an unsaved local draft. */
export function facultyQuizCanCopyToDraft(status:string|undefined,hasBank:boolean,pending:boolean,loadFailed:boolean){
 return !pending&&!loadFailed&&hasBank&&["DRAFT","PUBLISHED","CLOSED"].includes(status??"");
}
export function facultyQuizCopyTitle(original:string):string{
 const prefix="Copy of ";
 return prefix+original.trim().slice(0,255-prefix.length);
}

/** Persist the visible drag/button ordering, regardless of cloned draft indexes. */
export function facultyQuizNormalizeQuestions<T extends {sequence:number;options:{sequence:number}[]}>(items:readonly T[]):T[]{
 return items.map((question,i)=>({...question,sequence:i,
  options:question.options.map((option,j)=>({...option,sequence:j}))} as T));
}

/** A display-only filter: selected Quiz stays mounted while the Faculty member searches. */
export function facultyQuizMatchesSearch(quiz:{title:string;status:string},query:string):boolean {
 const term=query.trim().toLocaleLowerCase();
 return !term||quiz.title.toLocaleLowerCase().includes(term)||quiz.status.toLocaleLowerCase().includes(term);
}

/** Question search changes only what is visible, never the saved question order. */
export function facultyQuizQuestionMatches(
 question:{prompt:string;options:readonly {text:string}[]},index:number,query:string,
):boolean {
 const term=query.trim().toLocaleLowerCase();
 return !term||String(index+1)===term||question.prompt.toLocaleLowerCase().includes(term)
  ||question.options.some(option=>option.text.toLocaleLowerCase().includes(term));
}

/** Reuse the server command's shared question schema for inline authoring feedback. */
export function facultyQuizQuestionIssue(
 question:{type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE";prompt:string;points:number;sequence:number;
  options:readonly {text:string;correct:boolean;sequence:number}[]},
):string|null {
 return facultyQuizDraftIssue("Question check",[question]);
}

/** Current answer selection is explicit before a confirmation or save. */
export function facultyQuizAnswerSummary(question:{
 type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE";options:readonly {correct:boolean}[],
}):string {
 const count=question.options.filter(option=>option.correct).length;
 return count+" of "+question.options.length+" answers marked correct";
}

/** Insert at the point of teaching flow, not only at the end of a 100-item Quiz. */
export function facultyInsertQuizQuestionAfter<T>(questions:readonly T[],index:number,question:T):T[]{
 if(index<0||index>=questions.length||questions.length>=100)return [...questions];
 const next=[...questions];next.splice(index+1,0,question);return next;
}

/** Dedicated first/last controls avoid dozens of moves in a large question bank. */
export function facultyMoveQuizQuestionToEdge<T>(items:readonly T[],index:number,edge:"FIRST"|"LAST"):T[]{
 if(index<0||index>=items.length)return [...items];
 return facultyMoveQuizQuestion(items,index,edge==="FIRST"?0:items.length-1);
}

/** Add an unchecked option next to its alternatives while retaining the answer key. */
export function facultyInsertQuizOptionAfter<T>(options:readonly T[],index:number,newOption:T):T[]{
 if(options.length>=20||index<0||index>=options.length)return [...options];
 const next=[...options];next.splice(index+1,0,newOption);return next;
}

/** Removing a marked answer changes grading semantics; request explicit consent. */
export function facultyQuizOptionRemovalNeedsConfirmation(
 options:readonly {correct:boolean}[],index:number,
):boolean {
 return index>=0&&index<options.length&&Boolean(options[index]?.correct);
}

/** Use a short, human-readable destructive action description in the browser dialog. */
export function facultyQuizQuestionRemovalPrompt(index:number,prompt:string):string {
 const name=prompt.trim().replace(/\s+/g," ").slice(0,80);
 return "Remove question "+(index+1)+(name?' ("'+name+'")':"")+
  "? This removes its options from your unsaved draft.";
}

/** Bulk option entry may fill an empty draft or append to a valid existing key.
 * It refuses silent truncation, duplicate labels and blank entries. */
export function facultyQuizApplyPastedOptions(
 current:readonly {text:string;correct:boolean;sequence:number}[],raw:string,
):{ok:true;options:{text:string;correct:boolean;sequence:number}[]}|{ok:false;issue:string}{
 if(raw.length>40000)return {ok:false,issue:"Pasted answer text is too large."};
 const normalized=raw.trim();
 const lines=normalized.split(/\r?\n|\|/).map(line=>line.trim());
 if(!normalized||lines.length>20||lines.some(line=>!line||line.length>2000))
  return {ok:false,issue:"Paste nonblank options of at most 2000 characters each."};
 const filled=current.filter(option=>option.text.trim().length>0);
 if((filled.length===0&&lines.length<2)||filled.length+lines.length>20)
  return {ok:false,issue:"A question needs at least two options and supports at most twenty."};
 const labels=[...filled.map(option=>option.text.trim().toLocaleLowerCase()),
  ...lines.map(line=>line.toLocaleLowerCase())];
 if(new Set(labels).size!==labels.length)
  return {ok:false,issue:"Each option needs unique text, including existing answers."};
 const newOptions=lines.map((text,i)=>({text,correct:filled.length===0&&i===0,sequence:filled.length+i}));
 return {ok:true,options:[...filled,...newOptions].map((option,i)=>({...option,sequence:i}))};
}

/** Empty persisted draft banks cannot be safely published or overwritten. */
export function facultyQuizLoadedBankIssue(status:string|undefined,questionCount:number):string|null {
 if(status==="DRAFT"&&questionCount===0)
  return "This Quiz has no loaded questions. Retry before editing or publishing.";
 return null;
}

/** Retrying a failed read replaces the current metadata and local draft. */
export function facultyQuizRetryNeedsConfirmation(dirty:boolean,loading:boolean):boolean {
 return dirty&&!loading;
}

/** Keep the preflight aligned with the Section-scoped server title conflict. */
export function facultyQuizTitleConflict(
 rows:readonly {id:string;title:string}[],title:string,ownQuizId:string|undefined,
):boolean {
 const normalized=title.trim().toLocaleLowerCase();
 return Boolean(normalized)&&rows.some(row=>row.id!==ownQuizId&&
  row.title.trim().toLocaleLowerCase()===normalized);
}

/** Aggregate invalid bank items without exposing private learner responses. */
export function facultyQuizReviewIssues(
 questions:readonly {type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE";prompt:string;points:number;sequence:number;
 options:readonly {text:string;correct:boolean;sequence:number}[]}[],
):{invalidQuestions:number;totalPoints:number;overLimit:boolean}{
 const invalidQuestions=questions.filter(question=>facultyQuizQuestionIssue(question)!==null).length;
 const totalPoints=questions.reduce((sum,question)=>sum+question.points,0);
 return {invalidQuestions,totalPoints,overLimit:totalPoints>10000};
}

/** Invalid-only review acts on the full source bank, never a filtered save. */
export function facultyQuizShouldDisplayQuestion(
 question:{type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE";prompt:string;points:number;sequence:number;
 options:readonly {text:string;correct:boolean;sequence:number}[]},
 index:number,search:string,invalidOnly:boolean,
):boolean {
 return facultyQuizQuestionMatches(question,index,search)&&
  (!invalidOnly||facultyQuizQuestionIssue(question)!==null);
}

/** Never surface arbitrary fetch/JSON exception text to a Faculty user. */
export function facultyQuizReadErrorMessage(error:unknown):string {
 if(error instanceof Error &&
  (error.message==="Cannot load quiz questions for this Section."||
   error.message==="This Quiz has no loaded questions. Retry before editing or publishing."))
  return error.message;
 return "Could not load the current Section Quiz. Retry or return to the Quiz list.";
}

/** Explain whether answer removal reassigns the correct answer or merely removes one. */
export function facultyQuizOptionRemovalPrompt(
 type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE",
 options:readonly {correct:boolean}[],questionIndex:number,optionIndex:number,
):string {
 const selected=options.filter(option=>option.correct).length;
 const consequence=type==="SINGLE_CHOICE"||selected===1
  ?" A remaining choice will be marked correct."
  :" Other marked correct choices will remain.";
 return "Remove correct option "+(optionIndex+1)+" from question "+(questionIndex+1)+"?"+
  consequence;
}

/** A Faculty publish decision must be based on a saved, complete question bank. */
export function facultyQuizReadyToPublish(
 status:string|undefined,dirty:boolean,failed:boolean,
 questions:readonly {type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE";prompt:string;points:number;sequence:number;
 options:readonly {text:string;correct:boolean;sequence:number}[]}[],
):boolean {
 return facultyQuizCanPublishSavedDraft(status,dirty,failed)&&
  questions.length>0&&facultyQuizDraftIssue("Review before publishing",questions)===null;
}
