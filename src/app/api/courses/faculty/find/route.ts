import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listFacultyCourseDeliveries} from "@/modules/courses/faculty-course-service";
import {getFacultyAssessmentOverview} from "@/modules/courses/faculty-assessment-service";
import {getFacultyDeliveryRoster} from "@/modules/attendance/faculty-service";
import {listFacultyContacts} from "@/modules/courses/faculty-contacts-service";

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
  const results:{key:string;group:"Students"|"Colleagues"|"Courses"|"Assignments"|"Quizzes"|"Pages";label:string;context:string;href:string}[]=[];
  // A Faculty search may only surface students on this instructor's active
  // teaching rosters. Never search the college-wide student directory.
  const seen=new Set<string>();
  for(let index=0;index<courses.length&&seen.size<5;index+=8){
   const batch=await Promise.all(courses.slice(index,index+8).map(course=>
    getFacultyDeliveryRoster(ctx,course.deliveryId).then(value=>({
     course,roster:value.roster,
    })).catch(()=>({course,roster:[] as Array<{
     membershipId:string;displayName:string|null;rollNumber:string|null;
    }>}))
   ));
   for(const {course,roster} of batch){
    for(const learner of roster){
     if(seen.size>=5)break;
     if(seen.has(learner.membershipId))continue;
     if(![learner.displayName,learner.rollNumber].some(has))continue;
     seen.add(learner.membershipId);
     results.push({
      key:"student-"+course.deliveryId+"-"+learner.membershipId,group:"Students",
      label:learner.displayName?.trim()||"Student",
      context:(learner.rollNumber??"Roll not assigned")+" · "+course.sectionName+" · "+course.courseCode,
      href:"/teacher/courses/"+encodeURIComponent(course.deliveryId)+
       "/students/"+encodeURIComponent(learner.membershipId),
     });
    }
   }
  }
  const colleagues=await listFacultyContacts(ctx,{
   tab:"FACULTY",search:terms[0]!.trim(),page:1,pageSize:10,
  }).catch(()=>null);
  for(const person of colleagues?.items??[]){
   if(person.membershipId===ctx.membership?.id)continue;
   results.push({
    key:"colleague-"+person.membershipId,group:"Colleagues",
    label:person.displayName?.trim()||"Colleague",
    context:"Faculty"+(person.departmentName?" · "+person.departmentName:""),
    href:"/teacher/contacts/teachers/"+encodeURIComponent(person.membershipId),
   });
   if(results.filter(x=>x.group==="Colleagues").length>=4)break;
  }
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
  if("class schedule".includes(needle)||"schedule".includes(needle))
   results.push({key:"page-schedule",group:"Pages",label:"Class schedule",
    context:"Your teaching timetable",href:"/teacher/calendar"});
  if("assignments quizzes".includes(needle)||"assessments".includes(needle))
   results.push({key:"page-assessments",group:"Pages",label:"Assignments & quizzes",
    context:"Combined teaching assessments",href:"/teacher/assessments"});
  return NextResponse.json({results},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
