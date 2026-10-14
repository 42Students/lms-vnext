import type {HrDriveDraft} from "./hr-drive-draft-model";
export function duplicateHrDraftRound(draft:HrDriveDraft,index:number):HrDriveDraft{
 if(!Number.isInteger(index)||index<0||index>=draft.rounds.length||draft.rounds.length>=12)
  return draft;
 const row=draft.rounds[index]!;
 const existing=new Set(draft.rounds.map(item=>item.name.trim().toLocaleLowerCase()));
 let proposed="",n=1;
 while(n<=20){
  const suffix=n===1?" (copy)":" (copy "+n+")";
  proposed=row.name.trim().slice(0,120-suffix.length)+suffix;
  if(!existing.has(proposed.toLocaleLowerCase()))break;
  n++;
 }
 if(existing.has(proposed.toLocaleLowerCase()))return draft;
 const rounds=[...draft.rounds];
 rounds.splice(index+1,0,{...row,name:proposed});
 return {...draft,rounds};
}
