import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {listFacultyCourseDeliveries} from "./faculty-course-service";
import {getFacultyAssessmentOverview} from "./faculty-assessment-service";
import {listFacultyContacts} from "./faculty-contacts-service";
import {listActiveDeliveryLearners} from "./delivery-roster";
import {facultyFindMatches,type FacultyFindResult} from "./faculty-find-model";

/** The prototype search replaces the separate Contacts discovery workflow.
 * Students are read ONLY from the actor's currently assigned course deliveries;
 * faculty colleagues come from the existing same-college, privacy-masked
 * Faculty Contacts service. Every resulting detail route reauthorizes access. */
export async function searchFacultyWorkspace(ctx:RequestContext,term:string):
 Promise<FacultyFindResult[]>{
 const needle=term.trim().slice(0,100);
 const [courses,assessment,colleagues]=await Promise.all([
  listFacultyCourseDeliveries(ctx),
  getFacultyAssessmentOverview(ctx),
  listFacultyContacts(ctx,{tab:"FACULTY",search:needle,page:1,pageSize:20}),
 ]);
 const result:FacultyFindResult[]=[];
 const shown=new Set<string>();
 // Reuse the roster's exact elective-versus-regular authorization scope.
 // Batching avoids spawning an unbounded number of concurrent roster queries.
 if(!ctx.membership) return result;
 for(let start=0;start<courses.length&&shown.size<5;start+=6){
  const batch=courses.slice(start,start+6);
  const rosters=await Promise.all(batch.map(course=>listActiveDeliveryLearners({
   deliveryId:course.deliveryId,sectionId:course.sectionId,
   academicPeriodId:course.academicPeriodId,collegeId:ctx.membership!.collegeId,
  })));
  for(let i=0;i<batch.length&&shown.size<5;i++){
   const course=batch[i]!,roster=rosters[i]??[];
   for(const learner of roster){
    if(shown.size>=5)break;
    if(shown.has(learner.membershipId)||!facultyFindMatches(needle,
      [learner.displayName,learner.rollNumber]))continue;
    shown.add(learner.membershipId);
    result.push({key:"student-"+learner.membershipId,group:"Students",
     label:learner.displayName?.trim()||"Student",
     context:[learner.rollNumber,course.sectionName,course.courseCode].filter(Boolean).join(" · "),
     href:"/teacher/courses/"+encodeURIComponent(course.deliveryId)+
      "/students/"+encodeURIComponent(learner.membershipId)});
   }
  }
 }
 for(const member of colleagues.items){
  if(member.membershipId===ctx.membership.id)continue;
  result.push({key:"colleague-"+member.membershipId,group:"Colleagues",
   label:member.displayName?.trim()||"Faculty member",
   context:["Faculty",member.departmentName].filter(Boolean).join(" · "),
   href:"/teacher/contacts/teachers/"+encodeURIComponent(member.membershipId)});
  if(result.filter(item=>item.group==="Colleagues").length>=4)break;
 }
 let count=0;
 for(const course of courses){
  if(!facultyFindMatches(needle,[course.courseCode,course.courseName,course.sectionName]))continue;
  result.push({key:"course-"+course.deliveryId,group:"Courses",
   label:course.courseName,context:course.courseCode+" · "+course.sectionName,
   href:"/teacher/courses/"+encodeURIComponent(course.deliveryId)+"/home"});
  if(++count>=4)break;
 }
 count=0;
 for(const item of assessment.assignments){
  if(!facultyFindMatches(needle,[item.title,item.courseName,item.courseCode]))continue;
  result.push({key:"assignment-"+item.deliveryId+"-"+item.id,group:"Assignments",
   label:item.title,context:item.courseCode+" · "+item.sectionName,
   href:"/teacher/report/assignment/"+encodeURIComponent(item.id)+
    "?deliveryId="+encodeURIComponent(item.deliveryId)});
  if(++count>=3)break;
 }
 count=0;
 for(const item of assessment.quizzes){
  if(!facultyFindMatches(needle,[item.title,item.courseName,item.courseCode]))continue;
  result.push({key:"quiz-"+item.deliveryId+"-"+item.id,group:"Quizzes",
   label:item.title,context:item.courseCode+" · "+item.sectionName,
   href:"/teacher/report/quiz/"+encodeURIComponent(item.id)+
    "?deliveryId="+encodeURIComponent(item.deliveryId)});
  if(++count>=3)break;
 }
 const pages=[
  {key:"schedule",label:"Class schedule",href:"/teacher/calendar"},
  {key:"courses",label:"Courses",href:"/teacher/courses"},
  {key:"assessments",label:"Assignments & quizzes",href:"/teacher/assessments"},
  {key:"today",label:"Today",href:"/teacher"},
 ];
 const matching=pages.filter(item=>facultyFindMatches(needle,[item.label]));
 const fallback=matching.length?matching:[pages[0]!,pages[1]!];
 for(const page of fallback.slice(0,2)){
  result.push({key:"page-"+page.key,group:"Pages",label:page.label,
   context:"Open page",href:page.href});
 }
 return result;
}
