import "server-only";

import {and,desc,eq,isNotNull,isNull,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementCompanies,placementCompanyRelationships,placementTpoLeads} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "./scope";

/** A globally unverified employer cannot be made verified merely because a
 * recruiter joined or the college has chosen to trust its relationship.
 * This read-only queue surfaces actual pending identity verification, never
 * grants access or approves a recruiter automatically. */
export async function getTpoTodayCompanyVerificationAttention(
 context:RequestContext,scope:"MINE"|"TEAM",
){
 const membership=context.membership;
 if(!membership||!hasMembershipRole(context,"TPO")||
    membership.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE")
   throw new AuthorizationError("placements.manage");
 const collegeId=membership.collegeId;
 if(!can(context,"placements.manage",{collegeId}))
   throw new AuthorizationError("placements.manage");
 requirePermission(context,"placements.manage",{collegeId});
 await requirePlacementManageScope(context,collegeId);

 // Limit scanning, not company identity: never infer verification from a
 // recruiter's free-text companyName. Require a canonical linked relationship.
 const facts=await getDb().select({
  relationshipId:placementCompanyRelationships.id,
  companyId:placementCompanies.id,
  companyName:placementCompanies.name,
  collegeTrusted:placementCompanyRelationships.isTrusted,
  recruiterId:placementTpoLeads.id,
  recruiterName:placementTpoLeads.name,
 }).from(placementTpoLeads)
  .innerJoin(placementCompanyRelationships,and(
   eq(placementTpoLeads.companyRelationshipId,placementCompanyRelationships.id),
   eq(placementTpoLeads.collegeId,placementCompanyRelationships.collegeId),
  ))
  .innerJoin(placementCompanies,eq(
   placementCompanyRelationships.companyId,placementCompanies.id))
  .where(and(
   eq(placementTpoLeads.collegeId,collegeId),
   eq(placementCompanyRelationships.collegeId,collegeId),
   eq(placementCompanyRelationships.status,"ACTIVE"),
   isNull(placementCompanyRelationships.archivedAt),
   eq(placementCompanies.status,"ACTIVE"),
   isNull(placementCompanies.archivedAt),
   isNull(placementCompanies.verifiedAt),
   isNotNull(placementTpoLeads.recruiterUserId),
   ...(scope==="MINE"?[or(
    eq(placementTpoLeads.ownerMembershipId,membership.id),
    isNull(placementTpoLeads.ownerMembershipId),
   )]:[]),
  ))
  .orderBy(desc(placementTpoLeads.createdAt),desc(placementTpoLeads.id))
  .limit(101);

 const companyIds=new Set<string>();
 const items=[] as Array<{
  relationshipId:string;companyId:string;companyName:string;
  collegeTrusted:boolean;recruiterId:string;recruiterName:string;
 }>;
 for(const row of facts){
  if(companyIds.has(row.companyId))continue;
  companyIds.add(row.companyId);
  if(items.length<15)items.push(row);
 }
 return {items,hasMore:facts.length>100||companyIds.size>15};
}
