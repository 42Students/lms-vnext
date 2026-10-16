import {createHash} from "node:crypto";
/** LEARNER-learning-misc-26: Stable, per-learner question/option presentation.
 * Keeps database IDs intact for scoring and never changes instructor ordering.
 * SHA-256 permutation is a stable presentation shuffle, not exam secrecy. */
function digestOrder(quizId:string,memberId:string,kind:string,id:string){
 return createHash("sha256").update(
   "quiz-display-v1:"+quizId+":"+memberId+":"+kind+":"+id
 ).digest("hex");
}
export function shuffleQuizForLearner<T extends {id:string;options:readonly {id:string}[]}>(
 questions:readonly T[],quizId:string,memberId:string,shuffleQuestions:boolean,shuffleOptions:boolean
):T[]{
 const result=questions.map(question=>({
  ...question,
  options:shuffleOptions?[...question.options].sort((a,b)=>{
   const x=digestOrder(quizId,memberId,question.id,a.id);
   const y=digestOrder(quizId,memberId,question.id,b.id);
   return x.localeCompare(y)||a.id.localeCompare(b.id);
  }):[...question.options],
 }));
 if(!shuffleQuestions)return result as T[];
 return result.sort((a,b)=>{
  const x=digestOrder(quizId,memberId,"questions",a.id);
  const y=digestOrder(quizId,memberId,"questions",b.id);
  return x.localeCompare(y)||a.id.localeCompare(b.id);
 }) as T[];
}
