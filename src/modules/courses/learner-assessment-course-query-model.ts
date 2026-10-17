import {z} from "zod";
/** LEARNER-learning-misc-15: only roster-authorized course IDs may narrow
 * server-side assessment queries. Unknown/malformed query never broadens access. */
const uuid=z.string().uuid();
export function learnerAssessmentAuthorizedCourse(raw:unknown,
 courses:readonly {courseId:string}[]):string|null{
 const parsed=uuid.safeParse(raw);
 if(!parsed.success)return null;
 return courses.some(row=>row.courseId===parsed.data)?parsed.data:null;
}
export function learnerAssessmentCourseHref(kind:"ASSIGNMENT"|"QUIZ",courseId:string|null){
 const path=kind==="ASSIGNMENT"?"/learn/allAssignments":"/learn/allQuizzes";
 return courseId?path+"?course="+encodeURIComponent(courseId):path;
}
