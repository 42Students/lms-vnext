import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listFacultyCourseDeliveries} from "@/modules/courses/faculty-course-service";
import {getFacultyAssessmentOverview} from "@/modules/courses/faculty-assessment-service";

export const runtime="nodejs";
/** This is a Faculty-only search through already-authorized teaching scopes,
 * not a cross-campus people directory. Every destination reauthorizes on open.
 */
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const terms=params.getAll("q");
  if(terms.length!==1||[...params.keys()].some(key=>key!=="q")||
      terms[0]!.trim().length<2||terms[0]!.trim().length>100)
   return NextResponse.json({error:"INVALID_SEARCH"},{status:400,
    headers:{"Cache-Control":"private, no-store"}});
  const needle=terms[0]!.trim().toLocaleLowerCase("en-IN");
  const ctx=await getCurrentRequestContext();
  const [courses,assessments]=await Promise.all([
   listFacultyCourseDeliveries(ctx),getFacultyAssessmentOverview(ctx),
  ]);
  const has=(text:string|null|undefined)=>text?.toLocaleLowerCase("en-IN").includes(needle)??false;
  const results:{key:string;group:"Courses"|"Assignments"|"Quizzes";label:string;context:string;href:string}[]=[];
  for(const course of courses){
   if(![course.courseCode,course.courseName,course.sectionName].some(has))continue;
   results.push({
    key:"course-"+course.deliveryId,group:"Courses",
    label:course.courseName,context:course.courseCode+" · "+course.sectionName,
    href:"/teacher/courses/"+encodeURIComponent(course.deliveryId)+"/home",
   });
   if(results.length>=5)break;
  }
  for(const item of assessments.assignments){
   if(![item.title,item.courseName,item.courseCode,item.sectionName].some(has))continue;
   if(results.filter(row=>row.group==="Assignments").length>=4)break;
   results.push({
    key:"assignment-"+item.deliveryId+"-"+item.id,group:"Assignments",
    label:item.title,context:item.courseCode+" · "+item.sectionName,
    href:"/teacher/report/assignment/"+encodeURIComponent(item.id)+
     "?deliveryId="+encodeURIComponent(item.deliveryId),
   });
  }
  for(const item of assessments.quizzes){
   if(![item.title,item.courseName,item.courseCode,item.sectionName].some(has))continue;
   if(results.filter(row=>row.group==="Quizzes").length>=3)break;
   results.push({
    key:"quiz-"+item.deliveryId+"-"+item.id,group:"Quizzes",
    label:item.title,context:item.courseCode+" · "+item.sectionName,
    href:"/teacher/report/quiz/"+encodeURIComponent(item.id)+
     "?deliveryId="+encodeURIComponent(item.deliveryId),
   });
  }
  return NextResponse.json({results},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
