import {emptyHrDriveDraft,type HrDriveDraft} from "./hr-drive-draft-model";
export function hrDraftContainsWork(draft:HrDriveDraft):boolean{
 const empty=emptyHrDriveDraft();
 return (Object.keys(empty) as Array<keyof HrDriveDraft>).some(key=>{
  if(key==="rounds")return JSON.stringify(draft.rounds)!==JSON.stringify(empty.rounds);
  return draft[key]!==empty[key];
 });
}
