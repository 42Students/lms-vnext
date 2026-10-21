/** Legacy IDs are display/import references only. Never use them for access. */
export type LegacyProjectStatus="PLANNED"|"ACTIVE"|"COMPLETED"|"ARCHIVED";
export type LegacyTaskStatus="TODO"|"IN_PROGRESS"|"BLOCKED"|"IN_REVIEW"|"DONE";
const taskAliases:Readonly<Record<string,LegacyTaskStatus>>={
 TO_DO:"TODO",TODO:"TODO",IN_PROGRESS:"IN_PROGRESS",STARTED:"IN_PROGRESS",
 BLOCKED:"BLOCKED",IN_REVIEW:"IN_REVIEW",REVIEW:"IN_REVIEW",
 DONE:"DONE",COMPLETED:"DONE",
};
const actionAliases:Readonly<Record<string,string>>={
 DRAFT_SAVED:"Draft saved",DRAFT_CREATED:"Draft saved",DRAFT_UPDATED:"Draft updated",
 SUBMITTED:"Submitted",RESUBMITTED:"Resubmitted",REVIEWED:"Reviewed",
 CHANGES_REQUESTED:"Changes requested",APPROVED:"Approved",
 LOCKED:"Locked",REOPENED:"Reopened",ATTACHMENTS_CHANGED:"Attachments changed",
};
export function legacyTaskStatus(raw:unknown):LegacyTaskStatus|null{
 if(typeof raw!=="string")return null;
 return taskAliases[raw.trim().toUpperCase().replaceAll(" ","_")]??null;
}
export function legacyTaskDisplayStatus(raw:unknown){
 switch(legacyTaskStatus(raw)){
 case "TODO":return "To do";
 case "IN_PROGRESS":return "In progress";
 case "BLOCKED":return "Blocked";
 case "IN_REVIEW":return "In review";
 case "DONE":return "Done";
 default:return "Unknown status";
 }
}
export function legacyDeliveryEventLabel(raw:string){
 const key=raw.trim().toUpperCase().replaceAll(/[^A-Z0-9]+/g,"_");
 return actionAliases[key]??(raw.trim().slice(0,60)||"Recorded change");
}
/** Legacy revisionCount begins at zero; vNext versions begin at one. */
export function legacyRevisionCountFromVersion(version:number){
 return Number.isSafeInteger(version)&&version>=1?version-1:null;
}
export function canonicalTaskType(raw:unknown){
 if(typeof raw!=="string"||!raw.trim())return "STORY" as const;
 const value=raw.trim().toUpperCase();
 return value==="STORY"||value==="BUG"||value==="CHORE"||value==="SPIKE"
  ?value:"STORY";
}
export function legacyTaskPriority(raw:unknown){
 const value=typeof raw==="string"?raw.trim().toUpperCase():"";
 return value==="LOW"||value==="MEDIUM"||value==="HIGH"||value==="CRITICAL"
   ?value:"MEDIUM";
}
/** Display legacy ordinals as 1-based, store new sequences zero-based. */
export function legacyOrdinal(value:number|null|undefined,base:0|1=0){
 if(value===null||value===undefined||!Number.isSafeInteger(value)||value<base)return null;
 return value-base;
}
export function legacyMeetingStatus(status:string,meetingUrl:string|null){
 if(status==="DRAFT"||status==="REQUESTED")return "Scheduling requested";
 return meetingUrl?"Meeting link available":"Meeting link not added";
}
export function legacyPhaseLabel(phase:string|null){
 return phase?.trim().slice(0,80)||null;
}
export function legacyRelativeDueLabel(label:string|null,date:string|null){
 return label?.trim()||date||"No due date";
}
/** Stable ordering uses mapped old ordinal and UUID when timestamps collide. */
export function compareLegacyOrder(a:{legacySortOrder:number|null;sequence:number;id:string},
 b:{legacySortOrder:number|null;sequence:number;id:string}){
 const aa=a.legacySortOrder??a.sequence,bb=b.legacySortOrder??b.sequence;
 return aa-bb||a.sequence-b.sequence||a.id.localeCompare(b.id);
}
export function sourceProjectIdentity(legacyId:number|null,uuid:string){
 return legacyId!==null&&Number.isSafeInteger(legacyId)?String(legacyId):uuid;
}
