import type {LearnerQuizDraft} from "./learner-quiz-draft";
type Question={id:string;type:"SINGLE_CHOICE"|"MULTIPLE_CHOICE";options:readonly {id:string}[]};
/** Allow session draft values only when questions/options still exist in current quiz. */
export function normalizeLearnerQuizDraftForQuestions(
 draft:LearnerQuizDraft,questions:readonly Question[],
):LearnerQuizDraft {
 const answers:Record<string,string[]>={};
 for(const question of questions){
  const permitted=new Set(question.options.map(option=>option.id));
  const selected=Object.hasOwn(draft.answers,question.id)?draft.answers[question.id]??[]:[];
  const chosen=selected.filter(id=>permitted.has(id));
  const deduped=[...new Set(chosen)];
  if(deduped.length>0)answers[question.id]=question.type==="SINGLE_CHOICE"?deduped.slice(0,1):deduped;
 }
 return {answers,step:Number.isInteger(draft.step)&&draft.step>=0&&draft.step<questions.length?draft.step:0};
}
