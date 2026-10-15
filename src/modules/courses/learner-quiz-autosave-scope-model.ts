import { learnerQuizRouteScopeCurrent } from "./learner-quiz-route-scope-model";
type Input={storageKey:string;loadedScopeKey:string|null;review:boolean;loading:boolean;hasQuiz:boolean};
export function learnerQuizDraftCanPersist(input:Input):boolean {
 return Boolean(input.storageKey) && input.hasQuiz && !input.review && !input.loading &&
 learnerQuizRouteScopeCurrent(input.storageKey,input.loadedScopeKey);
}
