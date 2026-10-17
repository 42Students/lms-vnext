import {emptyHrDriveDraft,type HrDriveDraft} from "./hr-drive-draft-model";
export function hrDraftContainsWork(draft:HrDriveDraft):boolean{
 const empty=emptyHrDriveDraft();
 return (Object.keys(empty) as Array<keyof HrDriveDraft>).some(key=>{
  if(key==="rounds"||key==="branches")return JSON.stringify(draft[key])!==JSON.stringify(empty[key]);
  return draft[key]!==empty[key];
 });
}
