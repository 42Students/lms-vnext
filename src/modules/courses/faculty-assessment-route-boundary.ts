import {z} from "zod";
import {CoursesServiceError} from "./errors";

const query=z.object({deliveryId:z.string().uuid().optional()}).strict();
export function parseFacultyAssessmentReportRoute(id:unknown,search:unknown) {
 const parsed=query.safeParse(search);
 return parsed.success && z.string().uuid().safeParse(id).success
   ? {assessmentId:id as string,deliveryId:parsed.data.deliveryId??null}
   : null;
}
export function facultyAssignmentReportHidden(error:unknown):boolean {
 return error instanceof CoursesServiceError &&
  ["ASSIGNMENT_NOT_FOUND","ASSIGNMENT_DELIVERY_MISMATCH",
   "SECTION_DELIVERY_NOT_FOUND","FACULTY_TEACHING_SCOPE_REQUIRED",
   "LEARNING_ACCESS_DENIED"].includes(error.code);
}

export function facultyQuizReportHidden(error:unknown):boolean {
 return error instanceof CoursesServiceError &&
 ["QUIZ_NOT_FOUND","QUIZ_DELIVERY_MISMATCH",
  "SECTION_DELIVERY_NOT_FOUND","FACULTY_TEACHING_SCOPE_REQUIRED",
  "LEARNING_ACCESS_DENIED"].includes(error.code);
}

/** Legacy report copy without exposing whether an unauthorized UUID exists. */
export const FACULTY_REPORT_NOT_FOUND_MESSAGE="Report not found." as const;
export function facultyAssessmentReportErrorCopy(kind:"assignment"|"quiz",error:unknown){
 if(kind==="assignment"?facultyAssignmentReportHidden(error):facultyQuizReportHidden(error))
  return {title:FACULTY_REPORT_NOT_FOUND_MESSAGE,retry:false as const};
 return {title:"Couldn't load the report.",retry:true as const};
}

export function facultyReportRouteRecovery(assessmentId:unknown,deliveryId:unknown){
 const idIsValid=z.string().uuid().safeParse(assessmentId).success;
 const deliveryIsValid=z.string().uuid().safeParse(deliveryId).success;
 return {title:idIsValid&&!deliveryIsValid?"Select a Section to view this report.":"Report not found.",
   selectSection:idIsValid&&!deliveryIsValid,
   href:"/teacher/courses"};
}
