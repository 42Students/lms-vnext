import type {HrDriveDraft} from "./hr-drive-draft-model";
export function reorderHrDraftRound(draft:HrDriveDraft,index:number,direction:-1|1):HrDriveDraft{
 const nextIndex=index+direction;
 if(!Number.isInteger(index)||index<0||index>=draft.rounds.length||
   nextIndex<0||nextIndex>=draft.rounds.length)return draft;
 const rounds=[...draft.rounds];
 [rounds[index],rounds[nextIndex]]=[rounds[nextIndex]!,rounds[index]!];
 return {...draft,rounds};
}
