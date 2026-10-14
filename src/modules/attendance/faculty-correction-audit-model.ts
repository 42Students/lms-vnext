export function facultyCorrectionDelta(oldAbsent:readonly string[],nextAbsent:readonly string[]){
 const prior=new Set(oldAbsent),next=new Set(nextAbsent);
 const movedToAbsent=[...next].filter(id=>!prior.has(id)).length;
 const movedToPresent=[...prior].filter(id=>!next.has(id)).length;
 return {movedToAbsent,movedToPresent,changed:movedToAbsent+movedToPresent>0};
}
export function facultyCorrectionReasonValid(input:string|null|undefined){
 const normalized=input?.trim()??"";
 return normalized.length>=8&&normalized.length<=500;
}
