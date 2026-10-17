import "server-only";
import {inArray,max} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courseQuizzes} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {getCollegeContentAuthoringOptions} from "./college-content-authoring-service";

/** Uses only lessons already scoped to this College Admin. */
export async function getCollegeQuizAuthoringOptions(context:RequestContext){
 const scoped=await getCollegeContentAuthoringOptions(context,"RESOURCE");
 const ids=scoped.lessons.map(x=>x.id);
 const rows=ids.length?await getDb().select({
  lessonId:courseQuizzes.lessonId,highest:max(courseQuizzes.sequence),
 }).from(courseQuizzes).where(inArray(courseQuizzes.lessonId,ids))
 .groupBy(courseQuizzes.lessonId):[];
 const next=new Map(rows.map(x=>[x.lessonId,(x.highest??-1)+1]));
 return scoped.lessons.map(x=>({...x,nextSequence:next.get(x.id)??0}));
}
