/** Legacy hall imports are nonauthoritative until resolved to the current college. */
export function legacyHallName(name:string|null,legacyId:number|null){
 return name?.trim()||"Unnamed hall"+(legacyId!==null?" #"+legacyId:"");
}
export function legacyHallCapacity(raw:number|null){
 return Number.isSafeInteger(raw)&&raw!==null&&raw>=1&&raw<=5000?raw:1;
}
export function legacyHallDepartmentId(raw:number|null){
 return raw===0||raw===null?null:raw;
}
export function legacyHallStatus(wasDeleted:boolean|null){
 return wasDeleted===true?"ARCHIVED" as const:"ACTIVE" as const;
}
export function legacyRoomKind(raw:string|null){
 const kind=raw?.trim().toUpperCase().replaceAll(" ","_");
 return ["CLASSROOM","LECTURE_HALL","LAB","SEMINAR_HALL","AUDITORIUM","CONFERENCE_ROOM"].includes(kind??"")
  ?kind!:"CLASSROOM";
}
