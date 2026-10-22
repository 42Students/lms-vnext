import {and,count,eq,inArray} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,users} from "@/db/schema";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listLearnerCourseDeliveries} from "@/modules/courses/learner-course-service";

export const runtime="nodejs";
const selectedSchema=z.strictObject({deliveryId:z.uuid()});
const noStore={"Cache-Control":"private, no-store"};

/** The deprecated v2 course-search usage counter was process-local and
 * accepted legacy integer course IDs. This scoped replacement counts only
 * this learner's authorized deliveries; no search can reveal other tenants,
 * user histories, invisible course titles, or inferred integer-ID aliases. */
export async function GET(){
 try{
  const context=await getCurrentRequestContext();
  const courses=await listLearnerCourseDeliveries(context);
  const ids=[...new Set(courses.map(row=>row.deliveryId))];
  if(!ids.length)return Response.json({counts:{}},{headers:noStore});
  const rows=await getDb().select({deliveryId:activityEvents.subjectId,
   total:count()}).from(activityEvents)
   .where(and(eq(activityEvents.eventType,"courses.search.selected"),
     eq(activityEvents.actorMembershipId,context.membership!.id),
     eq(activityEvents.collegeId,context.membership!.collegeId),
     inArray(activityEvents.subjectId,ids)))
   .groupBy(activityEvents.subjectId);
  return Response.json({counts:Object.fromEntries(rows.map(row=>
   [row.deliveryId,Math.max(0,Number(row.total))]))},{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}

export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return Response.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  const input=selectedSchema.parse(await request.json());
  const context=await getCurrentRequestContext();
  const member=context.membership;
  const courses=await listLearnerCourseDeliveries(context);
  const selected=courses.find(row=>row.deliveryId===input.deliveryId);
  if(!member||!selected)return Response.json({error:"COURSE_NOT_FOUND"},{status:404,headers:noStore});
  const db=getDb();
  await db.transaction(async tx=>{
   // The member can lose access after the initial scoped course read.
   // Retain SHARE locks until this non-sensitive usage event commits.
   const [current]=await tx.select({id:collegeMemberships.id})
    .from(collegeMemberships)
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .where(and(eq(collegeMemberships.id,member.id),
     eq(collegeMemberships.collegeId,member.collegeId),
     eq(collegeMemberships.status,"ACTIVE"),
     eq(users.platformStatus,"ACTIVE")))
    .for("share").limit(1);
   if(!current)throw new Error("COURSE_ACCESS_ENDED");
   await tx.insert(activityEvents).values({
    organizationId:member.organizationId,collegeId:member.collegeId,
    actorUserId:context.user.id,actorMembershipId:member.id,
    module:"COURSES",eventType:"courses.search.selected",
    subjectType:"course_section_delivery",subjectId:input.deliveryId,
    subjectLabel:selected.courseName,
    summary:"Learner opened an authorized course from search",
    metadata:{courseId:selected.courseId,source:"HEADER_SEARCH"},
   });
  });
  return Response.json({recorded:true},{headers:noStore});
 }catch(error){
  if(error instanceof z.ZodError)return Response.json({error:"INVALID_SELECTION"},{status:400,headers:noStore});
  return apiErrorResponse(error);
 }
}
