import type {HrDriveDraft} from "./hr-drive-draft-model";
export function hrDraftPreviewRounds(draft:HrDriveDraft){
 return draft.rounds.map((round,index)=>({
  order:index+1,kind:round.kind,name:round.name.trim(),
 }));
}
