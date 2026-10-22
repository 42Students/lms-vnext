/** Readable audit labels, adapted from the legacy ActivityCenter's action grammar. */
type ActivityActor={id?:string|null;displayName?:string|null;email?:string|null;actorUserType?:string|null;role?:string|null;type?:string|null};
type ActivitySubject={subjectLabel?:string|null;subjectType:string;subjectId:string;metadata?:unknown;payloadJson?:unknown;targetNames?:Record<string,string>};
const VERBS:Record<string,string>={
 CREATE:"created",ADD:"added",UPDATE:"updated",EDIT:"edited",DELETE:"deleted",REMOVE:"removed",
 RESTORE:"restored",PROMOTE:"promoted",SUSPEND:"suspended",REACTIVATE:"reactivated",
 IMPERSONATE:"impersonated",ASSIGN:"assigned",UNASSIGN:"unassigned",SET:"changed",
 TOGGLE:"switched",READ:"viewed",VIEW:"viewed",MARK:"marked",SYNC:"synced",
 REORDER:"reordered",PUBLISH:"published",UNPUBLISH:"unpublished",ARCHIVE:"archived",
 APPROVE:"approved",REJECT:"rejected",IMPORT:"imported",EXPORT:"exported",
 MOVE:"moved",RESET:"reset",CLEAR:"cleared",GRADE:"graded",UPLOAD:"uploaded",
 SEND:"sent",INVITE:"invited",CLOSE:"closed",OPEN:"opened",COMPLETE:"completed",
 ROLLBACK:"rolled back",
};
const THINGS:Record<string,string>={
 CLASS_SCHEDULE:"a class session",LESSON_CONTENT:"lesson content",LECTURE_HALL:"lecture hall",
 SEMESTER_COURSE:"semester courses",MODULE_ACCESS:"module access for",
 COLLEGE_FEATURE:"a college feature",LEARNER_IDENTITY:"student identity documents of",
 PROJECT_TASK_COMMENT:"a comment on task",PROJECT_TASK:"task",PROJECT:"project",
 BATCH_SEMESTER:"the semester of batch",COURSE_BULK_STATUS:"the status of courses",
 LEARNER:"student",LEARNER_PROFILE:"student profile",
};
const SENTENCES:Record<string,string>={
 LEARNER_PROFILE_WRITE_BY_OTHER:"edited the profile of",
 PROJECT_ASSIGN_MENTOR:"assigned a mentor to project",
 PROJECT_ASSIGN_LEARNERS:"assigned students to project",
 PROJECT_RESOURCE_SYNC:"updated the resources of project",
 PROJECT_MEETINGS_SYNC:"updated the meetings of project",
 PROJECT_TASK_REORDER:"reordered tasks in project",
 CLASS_SCHEDULE_RECURRING_CREATE:"created repeating class sessions",
 SEMESTER_COURSE_BULK_ADD:"added courses to semester",
 SEMESTER_COURSE_REMOVE:"removed a course from semester",
 JOB_UPDATED:"updated drive",
};
const NAME_KEYS=["name","title","batchName","courseName","departmentName","className",
 "lessonName","programName","semesterName","label","contentTitle","quizTitle","projectName","taskTitle"];
export function collegeActivityActor(actor:ActivityActor|null){
 if(!actor||!actor.id)return "System";
 if(actor.displayName?.trim())return actor.displayName.trim();
 if(actor.email?.trim())return actor.email.trim();
 const kind=(actor.actorUserType??actor.role??actor.type??"").toUpperCase();
 return (kind==="LEARNER"||kind==="STUDENT"?"Student #":"Staff #")+actor.id.slice(-6);
}
export function collegeActivityItem(record:ActivitySubject,targetNames:Record<string,string>={}){
 if(record.subjectLabel?.trim())return record.subjectLabel.trim();
 const source=record.payloadJson??record.metadata;
 const payload=source&&typeof source==="object"&&!Array.isArray(source)?source as Record<string,unknown>:{};
 for(const key of NAME_KEYS){
  const value=payload[key];
  if(typeof value==="string"&&value.trim())return value.trim();
 }
 const first=typeof payload["firstName"]==="string"?payload["firstName"].trim():"";
 const last=typeof payload["lastName"]==="string"?payload["lastName"].trim():"";
 if(first||last)return [first,last].filter(Boolean).join(" ");
 const found=(record.targetNames??targetNames)[record.subjectType.toLowerCase()+":"+record.subjectId];
 if(found?.trim())return found.trim();
 const type=record.subjectType.replaceAll("_"," ").trim().replace(/\b[a-z]/g,c=>c.toUpperCase());
 return (type||"Item")+" #"+record.subjectId.slice(-8);
}
export function collegeActivityAction(eventType:string){
 const key=eventType.trim().toUpperCase();
 if(!key)return "Activity";
 if(SENTENCES[key])return SENTENCES[key];
 if(!key.includes(".")&&key.includes("_")){
  const tokens=key.split("_").filter(Boolean);
  let verbIndex=-1;
  for(let i=tokens.length-1;i>=0;i--){
   const token=tokens[i];
   if(token!==undefined&&VERBS[token]){verbIndex=i;break;}
  }
  if(verbIndex>=0){
   const entity=tokens.slice(0,verbIndex).filter(token=>token!=="BULK");
   const thing=THINGS[entity.join("_")]||entity.join(" ").toLowerCase()||"an item";
   const verbToken=tokens[verbIndex];
   if(verbToken!==undefined)return (VERBS[verbToken]??"changed")+" "+thing;
  }
  return "changed "+tokens.filter(token=>token!=="BULK").join(" ").toLowerCase();
 }
 const last=eventType.split(".").filter(Boolean).slice(-2);
 return last.join(" ").replaceAll("_"," ").replace(/\b[a-z]/g,c=>c.toUpperCase())||"Activity";
}
