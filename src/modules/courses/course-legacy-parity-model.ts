/** Legacy attendance/program course-info wire: formal_title is derived, never a
 * mutable second column. The old Java expression falls back on null only. */
export function legacyFormalTitle(input: { name: string; shortTitle: string | null }): string {
 return input.shortTitle === null ? input.name : input.shortTitle;
}

/** Presentation and import-only mapping. Membership authorization still uses
 * resolved offering+delivery UUIDs, never legacy class/course IDs. */
export function legacyCourseCode(input:{
 code:string;officialCode:string|null;shortTitle:string|null;
 legacyMetadata:Record<string,unknown>|null;
}){
 const raw=input.legacyMetadata?.["courseCode"];
 return typeof raw==="string"&&raw.trim()
  ?raw.trim():input.officialCode?.trim()||input.shortTitle?.trim()||input.code;
}
export function legacyCourseColor(value:string|null){
 if(!value)return null;
 const hex=value.trim();
 if(/^#[0-9a-fA-F]{3}$/.test(hex)){
   const [,a,b,c]=hex;
   return `#${a}${a}${b}${b}${c}${c}`.toUpperCase();
 }
 return /^#[0-9a-fA-F]{6}$/.test(hex)?hex.toUpperCase():null;
}
export function legacyCourseVisibility(input:{
 enabled:boolean;status:string;deletedAt:Date|null;
}):"ACTIVE"|"HIDDEN"|"ARCHIVED"{
 if(input.deletedAt||input.status==="ARCHIVED")return "ARCHIVED";
 return input.status!=="ACTIVE"||!input.enabled?"HIDDEN":"ACTIVE";
}
export function legacyCourseAssignmentRole(raw:string|null){
 return raw?.trim().toUpperCase()==="ASSISTANT"?"ASSISTANT":"PRIMARY";
}
export function legacyCoreElective(raw:boolean|null){
 return raw===true?"ELECTIVE":"CORE";
}
export function legacyCourseDisplayOrder(stored:number){
 return Number.isSafeInteger(stored)&&stored>=0?stored+1:1;
}
export function legacyCourseStoredOrder(shown:number){
 return Number.isSafeInteger(shown)&&shown>0?shown-1:null;
}
export function legacyCourseDurationSeconds(raw:number|null){
 return raw===null||!Number.isFinite(raw)||raw<0?0:Math.floor(raw);
}
export function legacyTeachingAssignmentIsActive(input:{
 endedAt:Date|null;deletedAt:Date|null;wasActive:boolean|null;
}){
 return !input.endedAt&&!input.deletedAt&&input.wasActive!==false;
}
export function legacyLessonTitle(input:string|null){
 return input?.trim()||"Untitled lesson";
}
/** Avoid reintroducing source soft-deleted historical attempts as active progress. */
export function legacyProgressIsCurrent(input:{
 deletedAt?:Date|null;legacyWasDeleted?:boolean|null;
}){
 return !input.deletedAt&&input.legacyWasDeleted!==true;
}
export function reconcileLegacyPointScore(raw:number|null){
 if(raw===null)return {points:1,changed:false};
 if(Number.isSafeInteger(raw)&&raw>=0&&raw<=1000)return {points:raw,changed:false};
 return {points:Math.min(1000,Math.max(0,Math.trunc(Number.isFinite(raw)?raw:0))),changed:true};
}
export function validateLegacyCourseHistoryDates(start:string|null,end:string|null){
 if(start&& !/^\d{4}-\d{2}-\d{2}$/.test(start))return false;
 if(end&& !/^\d{4}-\d{2}-\d{2}$/.test(end))return false;
 return !start||!end||end>=start;
}
