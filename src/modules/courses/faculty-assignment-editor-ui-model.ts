import {authoringLocalDateTime} from "./faculty-authoring-datetime-model";
/** Publishing only sends the saved revision; warn when a draft field is still unsaved. */
export function facultyAssignmentDraftDirty(current:{
 title:string; description:string|null; dueAt:string|null; maxPoints:number;
},draft:{title:string;description:string;dueAt:string;maxPoints:number}){
 return current.title!==draft.title.trim() ||
  (current.description??"")!==draft.description.trim() ||
  authoringLocalDateTime(current.dueAt)!==draft.dueAt ||
  current.maxPoints!==draft.maxPoints;
}

/** Give actionable field errors before any remote assignment mutation. */
export function facultyAssignmentDraftIssue(input:{title:string;description:string;maxPoints:number}):string|null{
 const title=input.title.trim();
 if(!title||title.length>255)return "Enter an assignment title (1–255 characters).";
 if(input.description.trim().length>10000)return "Assignment instructions must be at most 10000 characters.";
 if(!Number.isInteger(input.maxPoints)||input.maxPoints<0||input.maxPoints>1000)
  return "Enter a whole number from 0 to 1000";
 return null;
}

export type FacultyAssignmentAction = "CREATE"|"EDIT"|"PUBLISH"|"ARCHIVE";
/** A successful HTTP status does not prove a same-Section assignment mutation. */
export function facultyAssignmentCommandReceipt(
 raw:unknown, request:{action:FacultyAssignmentAction;deliveryId:string;assignmentId?:string;title?:string;maxPoints?:number},
):boolean {
 if(!raw||typeof raw!=="object"||!("assignment" in raw))return false;
 const row=(raw as {assignment:unknown}).assignment;
 if(!row||typeof row!=="object")return false;
 const data=row as Record<string,unknown>;
 if(typeof data.id!=="string"||!data.id||data.deliveryId!==request.deliveryId)return false;
 if(request.action!=="CREATE"&&data.id!==request.assignmentId)return false;
 const allowed=request.action==="ARCHIVE"?["ARCHIVED"]:
  request.action==="PUBLISH"?["PUBLISHED"]:
  request.action==="EDIT"?["DRAFT","PUBLISHED"]:["DRAFT"];
 if(!allowed.includes(String(data.status)))return false;
 if((request.action==="CREATE"||request.action==="EDIT")&&
   (data.title!==request.title||data.maxPoints!==request.maxPoints))return false;
 return typeof data.updatedAt==="string" && Number.isFinite(Date.parse(data.updatedAt));
}

/** The caller owns a synchronous ref lock; a pending command cannot be duplicated. */
export function facultyAssignmentMaySubmit(pending:boolean,locked:boolean){
 return !pending && !locked;
}

/** Any changed field voids the previously checked confirmation. */
export function facultyAssignmentConfirmationOnEdit(confirmed:boolean,oldValue:unknown,nextValue:unknown){
 return Object.is(oldValue,nextValue)?confirmed:false;
}

export function facultyAssignmentSwitchNeedsConfirmation(
 selected:string,next:string,existing:{title:string;description:string|null;dueAt:string|null;maxPoints:number}|null,
 draft:{title:string;description:string;dueAt:string;maxPoints:number},
){
 if(selected===next)return false;
 if(existing)return facultyAssignmentDraftDirty(existing,draft);
 return Boolean(draft.title.trim()||draft.description.trim()||draft.dueAt||draft.maxPoints!==10);
}

/** Archiving remains a confirmed, non-destructive lifecycle transition. */
export function facultyAssignmentArchiveWarning(title:string){
 const name=title.trim().slice(0,120)||"this assignment";
 return "Archive "+name+"? It will leave active course views, but historical submission and audit records remain.";
}

/** Persisted due instants cannot be published after the deadline passes. */
export function facultyAssignmentPublishIssue(dueAt:string|null,now:Date):string|null {
 if(dueAt===null)return "Select due date before publishing.";
 const when=new Date(dueAt).getTime();
 if(!Number.isFinite(when))return "Assignment due date is invalid; reload this Section.";
 return when<=now.getTime()?"Due date has passed. Save a future deadline before publishing.":null;
}

/** Errors must describe safe recovery, never reflect untrusted HTTP bodies. */
export function facultyAssignmentCommandError(status:number,body:unknown):string {
 const envelope:Record<string,unknown>=typeof body==="object"&&body!==null?body as Record<string,unknown>:{};
 const code=typeof envelope.error==="string" && /^[A-Z][A-Z0-9_]{0,79}$/.test(envelope.error)?envelope.error:"";
 if(status===401||status===403||code==="FACULTY_TEACHING_SCOPE_REQUIRED")
  return "Teaching access has changed. Reload or sign in with the correct Faculty account.";
 if(code==="ASSIGNMENT_HAS_SUBMISSIONS")
  return "This assignment has learner submissions. You cannot change grading fields or delete the submitted work.";
 if(status===409||code==="FACULTY_ASSIGNMENT_STALE_VERSION")
  return "This assignment changed. Reload the Section before editing again.";
 if(code==="ASSIGNMENT_NAME_CONFLICT")return "An assignment with this title already exists in the Section.";
 if(code==="INVALID_ASSIGNMENT_TRANSITION")return "This assignment cannot take that action in its current state.";
 if(status===429)return "Too many requests. Retry later.";
 if(status>=500)return "The save could not be confirmed. Reload before retrying.";
 return "The assignment change was rejected. Review the form or reload the Section.";
}

/** A no-op draft cannot be saved; the persisted command rejects unchanged fields. */
export function facultyAssignmentCanSaveDraft(
 current:{title:string;description:string|null;dueAt:string|null;maxPoints:number}|null,
 draft:{title:string;description:string;dueAt:string;maxPoints:number},
 pending:boolean,confirmed:boolean,
){
 return Boolean(current)&&!pending&&confirmed&&facultyAssignmentDraftDirty(current!,draft);
}
