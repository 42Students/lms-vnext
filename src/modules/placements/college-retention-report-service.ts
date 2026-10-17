import "server-only";
import {and,count,desc,eq,lt,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementApplications,placementApplicationScreenings,
 placementJobs,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";
export async function getCollegeApplicationRetentionReport(ctx:RequestContext){
 const collegeId=await requireCollegePlacementAdmin(ctx);
 const db=getDb(),cutoff=new Date(Date.now()-180*86400000);
 const predicate=and(eq(placementJobs.collegeId,collegeId),
  eq(collegeMemberships.collegeId,collegeId),
  or(eq(placementApplications.status,"WITHDRAWN"),
     eq(placementApplicationScreenings.status,"REJECTED")),
  lt(placementApplications.updatedAt,cutoff),
  lt(sql<Date>`coalesce(${placementApplicationScreenings.updatedAt},${placementApplications.updatedAt})`,cutoff));
 const from=db.select({id:placementApplications.id,jobTitle:placementJobs.title,
  learner:users.displayName,status:placementApplications.status,
  screening:placementApplicationScreenings.status,
  lastChange:sql<Date>`greatest(${placementApplications.updatedAt},
    coalesce(${placementApplicationScreenings.updatedAt},${placementApplications.updatedAt}))`.as("last_change")
 }).from(placementApplications)
 .innerJoin(placementJobs,eq(placementJobs.id,placementApplications.jobId))
 .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementApplications.membershipId))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .leftJoin(placementApplicationScreenings,
  eq(placementApplicationScreenings.applicationId,placementApplications.id))
 .where(predicate).as("retention_items");
 const [total,rows]=await Promise.all([
  db.select({total:count()}).from(from),
  db.select().from(from).orderBy(desc(from.lastChange),desc(from.id)).limit(200),
 ]);
 return{cutoff,days:180,total:total[0]?.total??0,rows,truncated:(total[0]?.total??0)>200,
  note:"Review candidates for applicable retention policy. This read-only report never removes application, offer, audit or student records."};
}
