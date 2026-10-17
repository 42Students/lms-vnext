import "server-only";
import {and,desc,eq,inArray} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {getCollegePersonEditor} from "./college-directory-person-editor-service";
/** COL-people-10: strictly member-scoped history, no cross-tenant actor search. */
export async function getCollegePersonAudit(ctx:RequestContext,rawId:unknown,rawKind:unknown){
 const id=z.uuid().parse(rawId),kind=z.enum(["FACULTY","LEARNER"]).parse(rawKind);
 const profile=await getCollegePersonEditor(ctx,id,kind);
 const collegeId=ctx.membership!.collegeId;
 const events=await getDb().select({id:activityEvents.id,summary:activityEvents.summary,
  kind:activityEvents.eventType,at:activityEvents.occurredAt,
  authorId:activityEvents.actorUserId,authorName:users.displayName,importance:activityEvents.importance})
  .from(activityEvents).leftJoin(users,eq(users.id,activityEvents.actorUserId)).where(and(eq(activityEvents.collegeId,collegeId),
   inArray(activityEvents.subjectType,["college_membership","COLLEGE_MEMBERSHIP"]),eq(activityEvents.subjectId,id)))
  .orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(100);
 return{person:{id,name:profile.name,kind},events,
  truncated:events.length===100};
}
