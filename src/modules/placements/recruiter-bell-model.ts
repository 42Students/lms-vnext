export type RecruiterBellItem={id:string;title:string;label:string;unread:boolean;createdAt:string;jobId:string};
export function recruiterBellAriaLabel(unread:number|null){
 return unread!==null&&unread>0?"Notifications, "+unread+" new":"Notifications";
}
export function recruiterBellPreview<T extends RecruiterBellItem>(rows:readonly T[],limit=6){
 return rows.slice(0,Math.max(0,limit));
}

/** Keep only the most recent async bell response. A late response from a
 * previous college must not replace the current college's notification list.
 * This gate is deliberately independent of React so races can be tested. */
export function createRecruiterBellRequestGate(){
 let generation=0;
 return {
  begin:()=>++generation,
  isCurrent:(request:number)=>request===generation,
  invalidate:()=>{generation+=1;},
 };
}
