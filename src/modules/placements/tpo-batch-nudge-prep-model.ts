export type TpoBatchNudgeRow={membershipId:string;name:string;registration:{choice:string|null}|null};
export function prepareTpoUnrecordedNudges<T extends TpoBatchNudgeRow>(rows:readonly T[],registered:boolean):T[]{
 if(!registered)return [];
 return rows.filter(row=>row.registration?.choice===null);
}
export function tpoBatchNudgeDraft(batchName:string):string{
 return "Please review your placement registration choice for "+batchName+" on the LMS portal. Your own selection remains voluntary, and a saved choice should not be changed based on this reminder.";
}
