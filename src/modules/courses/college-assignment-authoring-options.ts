import "server-only";
import {inArray,max} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courseAssignments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {getCollegeContentAuthoringOptions} from "./college-content-authoring-service";

/** An admin chooses a college-owned lesson. Section choices are separately
 * restricted to that lesson's offering; never accept a foreign delivery. */
export async function getCollegeAssignmentAuthoringCatalog(context:RequestContext){
 const scoped=await getCollegeContentAuthoringOptions(context,"RESOURCE");
 const lessonIds=scoped.lessons.map(x=>x.id);
 const existing=lessonIds.length?await getDb().select({
  lessonId:courseAssignments.lessonId,
  highest:max(courseAssignments.sequence),
 }).from(courseAssignments).where(inArray(courseAssignments.lessonId,lessonIds))
 .groupBy(courseAssignments.lessonId):[];
 const next=new Map(existing.map(x=>[x.lessonId,(x.highest??-1)+1]));
 return {
  lessons:scoped.lessons.map(x=>({...x,nextSequence:next.get(x.id)??0})),
  deliveries:scoped.deliveries,
 };
}

/** Retain the existing array-returning contract for other consumers and tests. */
export async function getCollegeAssignmentAuthoringOptions(context:RequestContext){
 return (await getCollegeAssignmentAuthoringCatalog(context)).lessons;
}
