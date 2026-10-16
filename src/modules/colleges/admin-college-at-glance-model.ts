export type CollegeAtGlanceCounts={
 students:number;faculty:number;courses:number;activeDrives:number;
};
export const COLLEGE_GLANCE_REFRESH_ERROR="Summary refresh failed";
export const COLLEGE_GLANCE_LOAD_ERROR="Couldn't load college summary";
export function isCollegeAtGlanceCounts(value:unknown):value is CollegeAtGlanceCounts{
 if(!value||typeof value!=="object")return false;
 const r=value as Record<string,unknown>;
 return ["students","faculty","courses","activeDrives"].every(k=>
  typeof r[k]==="number"&&Number.isSafeInteger(r[k])&&(r[k] as number)>=0);
}
export function displayedGlanceNumber(value:number|null){return value===null?"—":String(value);}
