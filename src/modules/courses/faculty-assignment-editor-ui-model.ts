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
