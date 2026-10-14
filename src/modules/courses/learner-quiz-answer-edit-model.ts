/** Clear only the current question. Do not mutate or lose selections from other questions. */
export function clearLearnerQuizAnswer(
 answers:Readonly<Record<string,readonly string[]>>,questionId:string,
):Record<string,string[]>{
 if(!Object.prototype.hasOwnProperty.call(answers,questionId))return {...answers} as Record<string,string[]>;
 const next:Record<string,string[]>={};
 for(const [id,options] of Object.entries(answers)){
  if(id!==questionId)next[id]=[...options];
 }
 return next;
}
