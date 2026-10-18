import "server-only";
import {can} from "@/modules/permissions/policy";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {CoursesServiceError} from "./errors";
import {listFacultyCourseDeliveries,getFacultyCourseWorkspace} from "./faculty-course-service";
import {
 facultyLiveClassesQuerySchema,pageFacultyLiveClasses,safeHttpsMeetingLink,mapFacultyLiveWorkspacesInBatches,
 type FacultyLiveClass,
} from "./faculty-live-classes-model";

/** Read migrated LIVE_CLASS lesson content for active teaching deliveries.
 * Raw meeting URLs never enter logs, audit metadata or diagnostic exceptions. */
export async function getFacultyLiveClasses(context:RequestContext,rawQuery:unknown){
 const query=facultyLiveClassesQuerySchema.parse(rawQuery);
 const membership=context.membership;
 if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"FACULTY")||
  !can(context,"courses.read",{
   collegeId:membership.collegeId,organizationId:membership.organizationId,
  }))throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
 const deliveries=await listFacultyCourseDeliveries(context);
 if(query.deliveryId&&!deliveries.some(d=>d.deliveryId===query.deliveryId))
  throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
 const filtered=query.deliveryId?deliveries.filter(d=>d.deliveryId===query.deliveryId):deliveries;
 const workspaces=await mapFacultyLiveWorkspacesInBatches(filtered,
  d=>getFacultyCourseWorkspace(context,d.deliveryId));
 const sessions:FacultyLiveClass[]=workspaces.flatMap(w=>w.lessons.flatMap(lesson=>
  lesson.contents.filter(c=>c.contentType==="LIVE_CLASS"&&
    c.startsAt&&c.endsAt&&c.status==="PUBLISHED").map(c=>({
   id:c.id,deliveryId:w.course.deliveryId,courseName:w.course.courseName,
   sectionName:w.course.sectionName,title:c.title,
   startsAt:c.startsAt!,endsAt:c.endsAt!,joinUrl:safeHttpsMeetingLink(c.externalUrl),
   status:c.status,updatedAt:c.updatedAt,
  }))
 ));
 return {query,lessonChoices:workspaces.flatMap(w=>w.lessons.map(lesson=>({
   id:lesson.id,title:lesson.name,deliveryId:w.course.deliveryId,
 }))),courses:deliveries.map(x=>({
  deliveryId:x.deliveryId,courseName:x.courseName,sectionName:x.sectionName,
 })),...pageFacultyLiveClasses(sessions,query,new Date())};
}
