/** Non-leaking recovery messages for the scoped Faculty live-class editor. */
export function facultyLiveSaveFeedback(code:string|undefined):string {
 switch(code){
  case "LESSON_CONTENT_STALE_VERSION":
   return "This live class changed since you opened it. Refresh before editing again.";
  case "FACULTY_TEACHING_SCOPE_REQUIRED":
   return "Your teaching access to this Section is no longer active.";
  case "SCHEDULE_EVENT_CONFLICT":
   return "A Section or instructor event already occupies this time. Choose another slot.";
  case "CONTENT_TYPE_SHAPE_INVALID":
  case "INVALID_REQUEST":
   return "Check the selected session, dates and HTTPS meeting link, then retry.";
  default:
   return "The live-class change could not be saved. No changes were confirmed.";
 }
}
