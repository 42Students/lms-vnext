import "server-only";
import {and,eq,isNotNull,lt,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementCompanyRelationships,placementJobs,placementTpoFollowups} from "@/db/schema";
import {placementTpoTeamAsks} from "@/db/schema/tpo-internal";
import {type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {hasPlacementTeamMembership} from "./placement-team-access-model";
import {hasDriveOwnerColumn} from "./tpo-team-unowned-service";
import {placementTableExists} from "./staged-tables";
import {requirePlacementManageScope} from "./scope";

/** Only persisted ownership/assignment facts count as work. Never infer
 * a permanent TPO owner from who created a drive or a lead. */
export async function readTpoTeamOwnershipWorkload(context:RequestContext,now:Date=new Date()){
 const member=context.membership;
 if(!member||!hasPlacementTeamMembership(context))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,member.collegeId);
 const [drivesReady,asksReady]=await Promise.all([
  hasDriveOwnerColumn(),placementTableExists("placement_tpo_team_asks"),
 ]);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const driveCounts=drivesReady?await tx.select({
   membershipId:placementJobs.ownerMembershipId,
   live:sql<number>`count(*) filter (where ${placementJobs.status} = 'PUBLISHED')::integer`,
   draft:sql<number>`count(*) filter (where ${placementJobs.status} = 'DRAFT')::integer`,
  }).from(placementJobs).where(and(
   eq(placementJobs.collegeId,college.id),
   isNotNull(placementJobs.ownerMembershipId),
  )).groupBy(placementJobs.ownerMembershipId):[];
  const companies=await tx.select({
   membershipId:placementCompanyRelationships.ownerMembershipId,
   count:sql<number>`count(*)::integer`,
  }).from(placementCompanyRelationships).where(and(
   eq(placementCompanyRelationships.collegeId,college.id),
   eq(placementCompanyRelationships.status,"ACTIVE"),
   isNotNull(placementCompanyRelationships.ownerMembershipId),
  )).groupBy(placementCompanyRelationships.ownerMembershipId);
  const followups=await tx.select({
   membershipId:placementTpoFollowups.ownerMembershipId,
   count:sql<number>`count(*)::integer`,
  }).from(placementTpoFollowups).where(and(
   eq(placementTpoFollowups.collegeId,college.id),
   isNotNull(placementTpoFollowups.ownerMembershipId),
   sql`${placementTpoFollowups.doneAt} is null`,
   lt(placementTpoFollowups.dueAt,now),
  )).groupBy(placementTpoFollowups.ownerMembershipId);
  const waiting=asksReady?await tx.select({
   membershipId:placementTpoTeamAsks.askerMembershipId,
   count:sql<number>`count(*)::integer`,
  }).from(placementTpoTeamAsks).where(and(
   eq(placementTpoTeamAsks.collegeId,college.id),
   eq(placementTpoTeamAsks.status,"OPEN"),
  )).groupBy(placementTpoTeamAsks.askerMembershipId):[];
  const members=new Map<string,{
   membershipId:string;liveDrives:number;draftDrives:number;companies:number;
   overdueFollowups:number;waitingOnOthers:number;
  }>();
  const get=(id:string)=>{
   let item=members.get(id);
   if(!item){item={membershipId:id,liveDrives:0,draftDrives:0,companies:0,
     overdueFollowups:0,waitingOnOthers:0};members.set(id,item);}
   return item;
  };
  for(const row of driveCounts)if(row.membershipId){
   const entry=get(row.membershipId);entry.liveDrives=Number(row.live);
   entry.draftDrives=Number(row.draft);
  }
  for(const row of companies)if(row.membershipId)get(row.membershipId).companies=Number(row.count);
  for(const row of followups)if(row.membershipId)get(row.membershipId).overdueFollowups=Number(row.count);
  for(const row of waiting)if(row.membershipId)get(row.membershipId).waitingOnOthers=Number(row.count);
  return {ready:true as const,drivesReady,asksReady,items:[...members.values()]};
 });
}
