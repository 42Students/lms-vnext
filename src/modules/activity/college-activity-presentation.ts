/** COL-verification-misc-13: plain-language labels derived only from recorded facts. */
export function collegeActivityActor(actor:{id?:string|null;displayName?:string|null;email?:string|null}|null){
 if(!actor||!actor.id)return "System";
 if(actor.displayName?.trim())return actor.displayName.trim();
 if(actor.email?.trim())return actor.email.trim();
 return "Staff #"+actor.id.slice(-6);
}
export function collegeActivityItem(record:{subjectLabel?:string|null;subjectType:string;subjectId:string}){
 if(record.subjectLabel?.trim())return record.subjectLabel;
 const type=record.subjectType.replaceAll("_"," ").trim().replace(/\b[a-z]/g,c=>c.toUpperCase());
 return type+" #"+record.subjectId.slice(-8);
}
export function collegeActivityAction(eventType:string){
 const last=eventType.split(".").filter(Boolean).slice(-2);
 if(!last.length)return "Activity";
 return last.join(" ").replaceAll("_"," ").replace(/\b[a-z]/g,c=>c.toUpperCase());
}
