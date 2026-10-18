import "server-only";
import {and,asc,eq,lte,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,collegeMemberships,placementApplications,placementJobs,users} from "@/db/schema";
import {placementCollegeApplicationStages} from "@/db/schema/placement-college-application-stages";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import type {RequestContext} from "@/modules/identity/context";

export async function getSuperAdminPlacementRetentionReport(context:RequestContext){
 const selected=requireSuperAdminSelectedCollege(context,"placements.read"),db=getDb();
 const now=new Date(),cutoff=new Date(now.getTime()-180*86400000);
 // Retention age is time since the latest application OR stage transition.
 // Sort by that same expression, not the older application timestamp.
 const lastActivity=sql<Date>`greatest(${placementApplications.updatedAt},
   coalesce(${placementCollegeApplicationStages.updatedAt},${placementApplications.updatedAt}))`
   .mapWith(placementApplications.updatedAt);
 const rows=await db.select({
  id:placementApplications.id,jobId:placementJobs.id,jobTitle:placementJobs.title,
  applicantName:users.displayName,applicationStatus:placementApplications.status,
  stage:placementCollegeApplicationStages.stage,lastUpdated:lastActivity,
 }).from(placementApplications)
 .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),
   eq(placementJobs.collegeId,selected.collegeId)))
 // Selected organization and college must resolve to the same persisted
 // parent. A cross-organization acting-scope pair cannot reveal retention
 // records simply because the college UUID happened to match.
 .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),
   selected.organizationId?eq(colleges.organizationId,selected.organizationId):undefined))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
   eq(collegeMemberships.collegeId,selected.collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .leftJoin(placementCollegeApplicationStages,and(
   eq(placementCollegeApplicationStages.applicationId,placementApplications.id),
   eq(placementCollegeApplicationStages.jobId,placementJobs.id)))
 .where(and(lte(lastActivity,cutoff),
  or(eq(placementApplications.status,"WITHDRAWN"),eq(placementCollegeApplicationStages.stage,"REJECTED"))))
 .orderBy(asc(lastActivity),asc(placementApplications.id)).limit(201);
 return {rows:rows.slice(0,200),truncated:rows.length>200,cutoff:cutoff.toISOString()};
}
