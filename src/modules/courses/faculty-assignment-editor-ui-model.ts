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
