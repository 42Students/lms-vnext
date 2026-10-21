import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,legacyIdMap,membershipRoles,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {getProjectAdminCollegeId} from "./admin-college-scope";
import {loadProjectCollegeScope} from "./scope";
import {ProjectsServiceError} from "./errors";

/** Resolve a historic faculty/mentor ID only through a same-college,
 * active membership crosswalk. Unresolvable legacy links never fall back
 * to an unfiltered global mentor directory.
 */
export async function findLegacyReassignmentMentorMembership(
 context:RequestContext,collegeId:string,legacyMentorId:number,
):Promise<string|null>{
 if(getProjectAdminCollegeId(context)!==collegeId||
    !Number.isSafeInteger(legacyMentorId)||legacyMentorId<=0)
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const college=await loadProjectCollegeScope(collegeId);
 requirePermission(context,"projects.manage",{
   collegeId,organizationId:college.organizationId,
 });
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"projects.manage",{
    collegeId,organizationId:college.organizationId,
  });
  const matches=await tx.select({membershipId:collegeMemberships.id})
   .from(legacyIdMap)
   .innerJoin(collegeMemberships,and(
      eq(collegeMemberships.id,legacyIdMap.newId),
      eq(collegeMemberships.collegeId,collegeId),
      eq(collegeMemberships.status,"ACTIVE"),
   ))
   .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
      eq(users.platformStatus,"ACTIVE")))
   .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"MENTOR"),
   ))
   .where(and(eq(legacyIdMap.collegeId,collegeId),
      eq(legacyIdMap.legacyId,String(legacyMentorId)),
      inArray(legacyIdMap.legacyEntityType,["mentor","faculty","teacher"]),
      inArray(legacyIdMap.newEntityType,["college_membership","membership"]),
   )).limit(2);
  const unique=[...new Set(matches.map(row=>row.membershipId))];
  return unique.length===1?unique[0]:null;
 });
}
