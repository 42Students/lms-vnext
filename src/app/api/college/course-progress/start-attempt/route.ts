import {NextResponse} from "next/server";
import {and,desc,eq,inArray,ne,sql} from "drizzle-orm";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {getDb} from "@/db/client";
import {
  collegeMemberships,courseLessons,courseLearningPaths,courseOfferings,
  courseSectionDeliveries,courses,departments,learnerContentProgress,
  learnerProgramEnrollments,lessonContents,sectionEnrollments,sections,
} from "@/db/schema";
import {hasMembershipRole} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {apiErrorResponse} from "@/lib/api-error";

export const runtime="nodejs";
const inputSchema=z.object({
  learnerMembershipId:z.string().uuid(),
  offeringId:z.string().uuid(),
  deliveryId:z.string().uuid(),
}).strict();
const freshMessage="This learner has no recorded progress for that course — they are already starting fresh.";

export async function POST(request:Request){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    const membership=context.membership;
    if(!membership||membership.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE"||
       !hasMembershipRole(context,"COLLEGE_ADMIN"))
      return NextResponse.json({error:"FORBIDDEN"},{status:403});
    requirePermission(context,"courses.manage",{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    });
    const decoded=inputSchema.safeParse(await request.json().catch(()=>null));
    if(!decoded.success)
      return NextResponse.json({error:"INVALID_REQUEST",message:"Select a learner and course."},{status:400});
    const {learnerMembershipId,offeringId,deliveryId}=decoded.data;
    const db=getDb();
    const result=await db.transaction(async tx=>{
      // Serialize by exact learner and offering, not by a global counter.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(
        ${learnerMembershipId+"|"+offeringId},0))`);
      const [allowed]=await tx.select({membershipId:collegeMemberships.id})
        .from(sectionEnrollments)
        .innerJoin(learnerProgramEnrollments,
          eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId))
        .innerJoin(collegeMemberships,
          eq(collegeMemberships.id,learnerProgramEnrollments.membershipId))
        .innerJoin(courseSectionDeliveries,
          eq(courseSectionDeliveries.sectionId,sectionEnrollments.sectionId))
        .innerJoin(courseOfferings,
          eq(courseOfferings.id,courseSectionDeliveries.offeringId))
        .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
        .innerJoin(departments,eq(departments.id,courses.departmentId))
        .innerJoin(sections,eq(sections.id,sectionEnrollments.sectionId))
        .where(and(eq(collegeMemberships.id,learnerMembershipId),
          eq(collegeMemberships.collegeId,membership.collegeId),
          eq(collegeMemberships.status,"ACTIVE"),
          eq(learnerProgramEnrollments.status,"ACTIVE"),
          eq(sectionEnrollments.status,"ACTIVE"),eq(sections.status,"ACTIVE"),
          eq(courseSectionDeliveries.id,deliveryId),
          eq(courseOfferings.id,offeringId),eq(courseOfferings.status,"ACTIVE"),
          eq(departments.collegeId,membership.collegeId)))
        .limit(1);
      if(!allowed)return {error:"Learner and course are not in the selected active college class.",status:403};
      const contents=await tx.select({id:lessonContents.id})
        .from(lessonContents)
        .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
        .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
        .where(and(eq(courseLearningPaths.offeringId,offeringId),
          ne(lessonContents.status,"ARCHIVED"),
          ne(courseLearningPaths.status,"ARCHIVED")))
        .limit(2001);
      if(contents.length>2000)return {error:"Too many content items; narrow the course scope.",status:409};
      if(!contents.length)return {error:"That course has no content to retake",status:400};
      const contentIds=contents.map(item=>item.id);
      const recorded=await tx.select({
        lessonContentId:learnerContentProgress.lessonContentId,
        attempt:learnerContentProgress.attempt,
        durationSeconds:learnerContentProgress.durationSeconds,
      }).from(learnerContentProgress)
        .where(and(eq(learnerContentProgress.membershipId,learnerMembershipId),
          inArray(learnerContentProgress.lessonContentId,contentIds)))
        .orderBy(desc(learnerContentProgress.attempt))
        .limit(10001);
      if(recorded.length>10000)return {error:"Too many attempts to update safely.",status:409};
      if(!recorded.length)return {alreadyFresh:true,attempt:1,message:freshMessage,status:200};
      const nextAttempt=Math.max(...recorded.map(item=>item.attempt))+1;
      if(!Number.isSafeInteger(nextAttempt))return {error:"Attempt counter exhausted.",status:409};
      const recentByContent=new Map<string,number>();
      for(const item of recorded){
        if(!recentByContent.has(item.lessonContentId))
          recentByContent.set(item.lessonContentId,item.durationSeconds);
      }
      await tx.insert(learnerContentProgress).values(contents.map(item=>({
        membershipId:learnerMembershipId,lessonContentId:item.id,attempt:nextAttempt,
        durationSeconds:recentByContent.get(item.id)??0,lastPositionSeconds:0,
        completedAt:null,firstCompletedAt:null,
      })));
      return {attempt:nextAttempt,previousAttempt:nextAttempt-1,
        contentItemsReset:contents.length,alreadyFresh:false,
        message:"Attempt "+nextAttempt+" started. The previous attempt is kept as history.",status:200};
    });
    if("error" in result)return NextResponse.json({error:"CANNOT_START_ATTEMPT",message:result.error},{
      status:result.status,headers:{"cache-control":"private, no-store"},
    });
    return NextResponse.json(result,{headers:{"cache-control":"private, no-store"}});
  }catch(error){return apiErrorResponse(error);}
}
