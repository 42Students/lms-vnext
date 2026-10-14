import {learnerApplicationStage,type LearnerApplicationBrowseItem} from "./learner-applications-browse-model";
/** All counts come from the caller's already authorized journey. */
export function learnerApplicationStageCounts<T extends LearnerApplicationBrowseItem>(items:readonly T[]){
 const counts=new Map<string,number>();
 for(const item of items){
   const stage=learnerApplicationStage(item);
   counts.set(stage,(counts.get(stage)??0)+1);
 }
 return [{stage:"all",count:items.length},...Array.from(counts.entries()).sort(([a],[b])=>a.localeCompare(b)).map(([stage,count])=>({stage,count}))];
}
