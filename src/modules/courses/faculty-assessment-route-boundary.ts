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
