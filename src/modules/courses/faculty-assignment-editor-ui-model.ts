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
 if(!Number.isInteger(input.maxPoints)||input.maxPoints<1||input.maxPoints>10000)
  return "Maximum points must be a whole number from 1 to 10000.";
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
 const status=request.action==="CREATE"?"DRAFT":request.action==="EDIT"?"DRAFT":request.action==="PUBLISH"?"PUBLISHED":"ARCHIVED";
 if(data.status!==status)return false;
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
