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
 const rows=questions.map(question=>{
  // Never propagate the authored correct-answer flag to learner display data.
  // Project to an allowlist even if a caller passes extra properties at runtime.
  const options=question.options.map(option=>({
   id:option.id,text:option.text,sequence:option.sequence,
  }));
  return {
   id:question.id,type:question.type,prompt:question.prompt,
   points:question.points,sequence:question.sequence,
   options:shuffleOptions?options.sort((a,b)=>{
    const left=digestOrder(quizId,memberId,question.id,a.id);
    const right=digestOrder(quizId,memberId,question.id,b.id);
    return left.localeCompare(right)||a.id.localeCompare(b.id);
   }):options,
  };
 });
 if(!shuffleQuestions)return rows;
 return rows.sort((a,b)=>{
  const left=digestOrder(quizId,memberId,"question",a.id);
  const right=digestOrder(quizId,memberId,"question",b.id);
  return left.localeCompare(right)||a.id.localeCompare(b.id);
 });
}
