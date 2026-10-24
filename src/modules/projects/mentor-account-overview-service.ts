import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {users,colleges,collegeMemberships} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasActiveMembership,hasMembershipRole} from "@/modules/identity/context";
import {ProjectsServiceError} from "./errors";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {listMyProjectInstances} from "./member-service";

/** All profile fields are resolved from the signed-in identity, never a
 * client-supplied person, college, phone number, or project identifier.
 */
export async function getMentorAccountOverview(context:RequestContext){
 const membership=context.membership;
 if(!membership||!hasActiveMembership(context)||
    !hasMembershipRole(context,"MENTOR")||
    context.user.platformStatus!=="ACTIVE")
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const [identity]=await getDb().select({
  name:users.displayName,email:users.email,phone:users.phoneE164,
  collegeName:colleges.name,collegeCode:colleges.code,
 }).from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(colleges,eq(colleges.id,collegeMemberships.collegeId))
  .where(and(
   eq(collegeMemberships.id,membership.id),
   eq(collegeMemberships.userId,context.user.id),
   eq(collegeMemberships.collegeId,membership.collegeId),
   eq(collegeMemberships.organizationId,membership.organizationId),
   eq(collegeMemberships.status,"ACTIVE"),
   eq(users.platformStatus,"ACTIVE"),
  )).limit(1);
 if(!identity)throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const enabled=(await resolveOptionalModuleAccess(context)).projects.enabled;
 const assignments=enabled?(await listMyProjectInstances(context))
   .filter(row=>row.memberRole==="MENTOR"&&
       row.project.collegeId===membership.collegeId):[];
 const courses=[...new Set(assignments.map(row=>row.project.courseLabel?.trim())
   .filter((label):label is string=>Boolean(label)))].sort();
 return {name:identity.name??"Mentor",email:identity.email,
  phone:identity.phone,collegeName:identity.collegeName,
  collegeCode:identity.collegeCode,
  teamCount:assignments.length,courses,projectsEnabled:enabled,
  hasFacultyProfile:membership.roles.includes("FACULTY")};
}
