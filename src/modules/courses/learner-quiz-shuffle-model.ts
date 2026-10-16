import {createHash} from "node:crypto";
/** LEARNER-learning-misc-26: deterministic, per-learner quiz display order.
 * Stable IDs are preserved for scoring; the salt is not an anti-cheating secret. */
export type QuizDisplayQuestion={
 id:string;type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE";prompt:string;points:number;sequence:number;
 options:Array<{id:string;text:string;sequence:number;correct?:boolean}>;
};
function digestOrder(quizId:string,memberId:string,kind:string,id:string){
 return createHash("sha256").update(
   "quiz-display-v1:"+quizId+":"+memberId+":"+kind+":"+id
 ).digest("hex");
}
export function shuffleQuizForLearner(
 questions:readonly QuizDisplayQuestion[],quizId:string,memberId:string,
 shuffleQuestions:boolean,shuffleOptions:boolean
):QuizDisplayQuestion[]{
 const rows=questions.map(question=>({
  ...question,
  options:shuffleOptions?[...question.options].sort((a,b)=>{
   const left=digestOrder(quizId,memberId,question.id,a.id);
   const right=digestOrder(quizId,memberId,question.id,b.id);
   return left.localeCompare(right)||a.id.localeCompare(b.id);
  }):[...question.options],
 }));
 if(!shuffleQuestions)return rows;
 return rows.sort((a,b)=>{
  const left=digestOrder(quizId,memberId,"question",a.id);
  const right=digestOrder(quizId,memberId,"question",b.id);
  return left.localeCompare(right)||a.id.localeCompare(b.id);
 });
}
