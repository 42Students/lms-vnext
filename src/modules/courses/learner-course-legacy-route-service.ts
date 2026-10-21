import "server-only";
import {inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courses} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {listLearnerCourseDeliveries} from "./learner-course-service";

/** Resolve a legacy numeric course ID or slug only AFTER reading the learner's
 * own scoped enrollments. Never resolve a public course catalog identifier into
 * an unauthorized college, Section or elective delivery. */
export async function resolveLegacyLearnerCourseDelivery(
 context:RequestContext,legacyKey:string,
):Promise<string|null>{
 const key=legacyKey.trim();
 if(!key||key.length>64||key.includes("/")||key.includes("%"))return null;
 const deliveries=await listLearnerCourseDeliveries(context,{includeHistorical:true});
 const exact=deliveries.find(row=>row.deliveryId===key);
 if(exact)return exact.deliveryId;
 const courseIds=[...new Set(deliveries.map(row=>row.courseId))];
 if(!courseIds.length)return null;
 const catalog=await getDb().select({
  id:courses.id,slug:courses.slug,legacyCourseId:courses.legacyCourseId,
 }).from(courses).where(inArray(courses.id,courseIds));
 const legacyId=/^[1-9]\d{0,9}$/.test(key)?Number(key):null;
 const matchedIds=new Set(catalog.filter(row=>
  row.slug===key||(legacyId!==null&&row.legacyCourseId===legacyId))
  .map(row=>row.id));
 if(matchedIds.size!==1)return null;
 // Prefer the active enrollment when a legacy course is taught across terms,
 // otherwise preserve the delivery returned first by the authoritative
 // semester-descending learner roster.
 const candidates=deliveries.filter(row=>matchedIds.has(row.courseId));
 const active=candidates.find(row=>row.sectionEnrollmentStatus==="ACTIVE"&&
  row.programEnrollmentStatus==="ACTIVE"&&row.periodStatus==="ACTIVE"&&
  row.deliveryEndedAt===null);
 return active?.deliveryId??candidates[0]?.deliveryId??null;
}
