import "server-only";

import {and,asc,eq,inArray,isNull,ne,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
 courseAssignments,courseLearningPaths,courseLessons,courseQuizzes,
 courseSectionDeliveries,lessonContents,sections,
} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {loadCourseOfferingScope} from "./scope";

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
 const db=getDb();
 const rows=await db.select({
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
 const selected=options.find(row=>row.deliveryId===requestedDeliveryId)??null;
 const invalid=Boolean(requestedDeliveryId&&!selected);
 if(!selected)return {options,truncated,selected:null,invalid,lessons:[]};

 const lessonIds=[...new Set(lessons.map(item=>item.id))];
 if(!lessonIds.length)return {options,truncated,selected,invalid,lessons:[]};

 // The source of every item is joined back to the authorized offering, even
 // though the lesson IDs came from the already-authorized page workspace.
 const audience=(deliveryId:typeof lessonContents.deliveryId)=>
  or(isNull(deliveryId),eq(deliveryId,selected.deliveryId));
 const [contentRows,assignmentRows,quizRows]=await Promise.all([
  db.select({
   id:lessonContents.id,lessonId:lessonContents.lessonId,
   title:lessonContents.title,kind:lessonContents.contentType,
   status:lessonContents.status,sequence:lessonContents.sequence,
   deliveryId:lessonContents.deliveryId,visibleToStudents:lessonContents.visibleToStudents,
  }).from(lessonContents)
   .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
   .innerJoin(courseLearningPaths,and(
    eq(courseLearningPaths.id,courseLessons.learningPathId),
    eq(courseLearningPaths.offeringId,offering.id)))
   .where(and(inArray(lessonContents.lessonId,lessonIds),
    ne(lessonContents.status,"ARCHIVED"),audience(lessonContents.deliveryId)))
   .orderBy(asc(lessonContents.lessonId),asc(lessonContents.sequence),asc(lessonContents.id)),
  db.select({
   id:courseAssignments.id,lessonId:courseAssignments.lessonId,
   title:courseAssignments.title,status:courseAssignments.status,
   sequence:courseAssignments.sequence,deliveryId:courseAssignments.deliveryId,
  }).from(courseAssignments)
   .innerJoin(courseLessons,eq(courseLessons.id,courseAssignments.lessonId))
   .innerJoin(courseLearningPaths,and(
    eq(courseLearningPaths.id,courseLessons.learningPathId),
    eq(courseLearningPaths.offeringId,offering.id)))
   .where(and(inArray(courseAssignments.lessonId,lessonIds),
    ne(courseAssignments.status,"ARCHIVED"),
    or(isNull(courseAssignments.deliveryId),eq(courseAssignments.deliveryId,selected.deliveryId))))
   .orderBy(asc(courseAssignments.lessonId),asc(courseAssignments.sequence),asc(courseAssignments.id)),
  db.select({
   id:courseQuizzes.id,lessonId:courseQuizzes.lessonId,
   title:courseQuizzes.title,status:courseQuizzes.status,
   sequence:courseQuizzes.sequence,deliveryId:courseQuizzes.deliveryId,
  }).from(courseQuizzes)
   .innerJoin(courseLessons,eq(courseLessons.id,courseQuizzes.lessonId))
   .innerJoin(courseLearningPaths,and(
    eq(courseLearningPaths.id,courseLessons.learningPathId),
    eq(courseLearningPaths.offeringId,offering.id)))
   .where(and(inArray(courseQuizzes.lessonId,lessonIds),
    ne(courseQuizzes.status,"ARCHIVED"),
    or(isNull(courseQuizzes.deliveryId),eq(courseQuizzes.deliveryId,selected.deliveryId))))
   .orderBy(asc(courseQuizzes.lessonId),asc(courseQuizzes.sequence),asc(courseQuizzes.id)),
 ]);

 const byLesson=<T extends {lessonId:string}>(items:readonly T[])=>{
  const map=new Map<string,T[]>();
  for(const item of items){
   const list=map.get(item.lessonId)??[];
   list.push(item);map.set(item.lessonId,list);
  }
  return map;
 };
 const contents=byLesson(contentRows);
 const assignments=byLesson(assignmentRows);
 const quizzes=byLesson(quizRows);
 const sectionLessons=lessons.map(lesson=>({
  id:lesson.id,name:lesson.name,sequence:lesson.sequence,
  visibleToStudents:lesson.visibleToStudents,lessonStatus:lesson.status,
  contents:(contents.get(lesson.id)??[]).map(item=>({
   id:item.id,title:item.title,kind:item.kind,status:item.status,
   sequence:item.sequence,scope:item.deliveryId?"SECTION":"SHARED",
   visibleToStudents:item.visibleToStudents,
   studentVisible:learningPathPublished&&lesson.visibleToStudents&&lesson.status==="ACTIVE"&&
    item.status==="PUBLISHED"&&item.visibleToStudents,
  })),
  assignments:(assignments.get(lesson.id)??[]).map(item=>({
   id:item.id,title:item.title,status:item.status,sequence:item.sequence,
   scope:item.deliveryId?"SECTION":"SHARED",
   studentVisible:learningPathPublished&&lesson.visibleToStudents&&lesson.status==="ACTIVE"&&
    item.status==="PUBLISHED",
  })),
  quizzes:(quizzes.get(lesson.id)??[]).map(item=>({
   id:item.id,title:item.title,status:item.status,sequence:item.sequence,
   scope:item.deliveryId?"SECTION":"SHARED",
   studentVisible:learningPathPublished&&lesson.visibleToStudents&&lesson.status==="ACTIVE"&&
    (item.status==="PUBLISHED"||item.status==="CLOSED"),
  })),
 }));
 return {options,truncated,selected,invalid,lessons:sectionLessons};
}
