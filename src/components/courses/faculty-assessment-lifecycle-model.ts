/**
 * Client visibility is a convenience only. The two Faculty command services
 * recheck the persisted teaching assignment, Section, token, and attempt/submission
 * guards inside a transaction. Shared Offering assessments are never mutable here.
 */
export type FacultyAssessmentLifecycleAction = "PUBLISH"|"CLOSE"|"ARCHIVE";
export type FacultyAssessmentLifecycleKind = "ASSIGNMENT"|"QUIZ";

export function facultyAssessmentLifecycleActions(input:{
  kind:FacultyAssessmentLifecycleKind;
  owned:boolean;
  status:string;
}):FacultyAssessmentLifecycleAction[]{
  if(!input.owned)return [];
  if(input.status==="DRAFT")return ["PUBLISH","ARCHIVE"];
  if(input.status==="PUBLISHED"){
    return input.kind==="QUIZ"?["CLOSE","ARCHIVE"]:["ARCHIVE"];
  }
  if(input.kind==="QUIZ"&&input.status==="CLOSED")return ["ARCHIVE"];
  return [];
}

export function facultyAssessmentLifecycleWarning(
  kind:FacultyAssessmentLifecycleKind, action:FacultyAssessmentLifecycleAction,
){
  if(action==="PUBLISH")return "Publish this "+kind.toLowerCase()+" to the current Section? Check the draft and deadline first.";
  if(action==="CLOSE")return "Close this published quiz? New attempts will be blocked; prior attempts and released results remain.";
  return kind==="QUIZ"?
    "Delete this quiz? Learners will no longer be able to open it. This cannot be undone.":
    "Delete this assignment? Learners will no longer be able to open it. This cannot be undone.";
}

export function facultyAssessmentLifecyclePayload(input:{
  kind:FacultyAssessmentLifecycleKind;
  id:string;
  expectedUpdatedAt:string;
  action:FacultyAssessmentLifecycleAction;
}){
  const common={action:input.action,expectedUpdatedAt:input.expectedUpdatedAt,confirmed:true as const};
  return input.kind==="QUIZ"?{...common,quizId:input.id}:
    {...common,assignmentId:input.id};
}
