/** Screen #05 Blueprint + Add content destinations. Each action must lead to
 * the appropriate scoped authoring control, never six identical generic links.
 * Caller supplies lesson/delivery IDs already authorized in the workspace.
 */
export const FACULTY_BLUEPRINT_ADD_KINDS=[
 "Video","YouTube","Resource","Live class","Assignment","Quiz",
] as const;
export type FacultyBlueprintAddKind=typeof FACULTY_BLUEPRINT_ADD_KINDS[number];
export type FacultyBlueprintContentCreateMode="VIDEO"|"YOUTUBE"|"RESOURCE"|"LIVE_CLASS";
export function facultyBlueprintCreateMode(raw:unknown):FacultyBlueprintContentCreateMode|null{
 return raw==="VIDEO"||raw==="YOUTUBE"||raw==="RESOURCE"||raw==="LIVE_CLASS"?raw:null;
}
export function facultyBlueprintAddTarget(deliveryId:string,lessonId:string,kind:FacultyBlueprintAddKind){
 const delivery=encodeURIComponent(deliveryId);
 const lesson=encodeURIComponent(lessonId);
 if(kind==="Assignment"||kind==="Quiz")
  return "/teacher/courses/"+delivery+"/"+(kind==="Quiz"?"quizzes":"assignments")+
   "/manage?lesson="+lesson;
 const mode:FacultyBlueprintContentCreateMode=kind==="Video"?"VIDEO":
  kind==="YouTube"?"YOUTUBE":kind==="Resource"?"RESOURCE":"LIVE_CLASS";
 return "/teacher/courses/"+delivery+"/blueprint?lesson="+lesson+
  "&advanced=1&create="+mode+"#"+(mode==="VIDEO"?"faculty-video-upload-":"faculty-lesson-add-")+lesson;
}
