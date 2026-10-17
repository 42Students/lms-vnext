import "server-only";

import {and,asc,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courseSectionDeliveries,sections} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {loadCourseOfferingScope} from "./scope";
import {listLessonContents} from "./lesson-content-service";
import {listCourseAssignments} from "./assignment-service";
import {listCourseQuizzes} from "./quiz-service";

const MAX_SECTION_OPTIONS=200;
type LessonRef={id:string;name:string;sequence:number;visibleToStudents:boolean;status:string};

export async function listOfferingSectionPreview(
 context:RequestContext,offeringId:string,requestedDeliveryId:string|null,
 lessons:readonly LessonRef[],learningPathPublished:boolean,
){
 const offering=await loadCourseOfferingScope(offeringId);
 requirePermission(context,"courses.manage",{
  collegeId:offering.collegeId,organizationId:offering.organizationId,
 });
 const rows=await getDb().select({
  deliveryId:courseSectionDeliveries.id,
  sectionName:sections.name,sectionCode:sections.code,
 }).from(courseSectionDeliveries)
 .innerJoin(sections,and(
  eq(sections.id,courseSectionDeliveries.sectionId),
  eq(sections.cohortId,offering.cohortId),
  eq(sections.academicPeriodId,offering.academicPeriodId),
  eq(sections.status,"ACTIVE"),
 ))
 .where(and(
  eq(courseSectionDeliveries.offeringId,offering.id),
  isNull(courseSectionDeliveries.endedAt),
 ))
 .orderBy(asc(sections.name),asc(sections.code),asc(courseSectionDeliveries.id))
 .limit(MAX_SECTION_OPTIONS+1);

 const options=rows.slice(0,MAX_SECTION_OPTIONS);
 const truncated=rows.length>MAX_SECTION_OPTIONS;
 // Selection must exist in this live offering. An arbitrary delivery UUID
 // cannot be used as an oracle for other colleges or offerings.
 const selected=options.find(row=>row.deliveryId===requestedDeliveryId)??null;
 const invalid=Boolean(requestedDeliveryId&&!selected);
 if(!selected)return {options,truncated,selected:null,invalid,lessons:[]};

 const sectionLessons=await Promise.all(lessons.map(async lesson=>{
  const [contents,assignments,quizzes]=await Promise.all([
   listLessonContents(context,lesson.id,selected.deliveryId),
   listCourseAssignments(context,lesson.id,selected.deliveryId),
   listCourseQuizzes(context,lesson.id,selected.deliveryId),
  ]);
  return {
   id:lesson.id,name:lesson.name,sequence:lesson.sequence,
   visibleToStudents:lesson.visibleToStudents,lessonStatus:lesson.status,
   contents:contents.map(item=>({
    id:item.id,title:item.title,kind:item.contentType,status:item.status,
    sequence:item.sequence,scope:item.deliveryId?"SECTION":"SHARED",
    visibleToStudents:item.visibleToStudents,
    studentVisible:learningPathPublished&&lesson.visibleToStudents&&lesson.status==="ACTIVE"&&
      item.status==="PUBLISHED"&&item.visibleToStudents,
   })),
   assignments:assignments.map(item=>({
    id:item.id,title:item.title,status:item.status,sequence:item.sequence,
    scope:item.deliveryId?"SECTION":"SHARED",
    studentVisible:learningPathPublished&&lesson.visibleToStudents&&lesson.status==="ACTIVE"&&item.status==="PUBLISHED",
   })),
   quizzes:quizzes.map(item=>({
    id:item.id,title:item.title,status:item.status,sequence:item.sequence,
    scope:item.deliveryId?"SECTION":"SHARED",
    studentVisible:learningPathPublished&&lesson.visibleToStudents&&lesson.status==="ACTIVE"&&
      (item.status==="PUBLISHED"||item.status==="CLOSED"),
   })),
  };
 }));
 return {options,truncated,selected,invalid,lessons:sectionLessons};
}
