import "server-only";
import { and,count,eq,inArray,isNull,sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships,membershipRoles,projectMembers,users } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole } from "@/modules/identity/context";
import { ProjectsServiceError } from "./errors";
import { listMyProjectInstances } from "./member-service";

/** Active persisted project memberships only, scoped by the same authenticated Mentor roster. */
export async function getMentorProjectTeamSizes(context:RequestContext,
 verifiedRows?:readonly Awaited<ReturnType<typeof listMyProjectInstances>>[number][]){
 if(!hasMembershipRole(context,"MENTOR")||context.user.platformStatus!=="ACTIVE")
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const ids=(verifiedRows??await listMyProjectInstances(context))
   .filter(row=>row.memberRole==="MENTOR").map(row=>row.project.id);
 const sizes=new Map<string,number>();
 if(!ids.length)return sizes;
 const rows=await getDb().select({projectId:projectMembers.projectId,total:count()})
   .from(projectMembers)
   .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
     sql`cast(${membershipRoles.role} as text)=${projectMembers.role}`))
   .where(and(inArray(projectMembers.projectId,ids),isNull(projectMembers.endedAt),
     eq(collegeMemberships.collegeId,context.membership!.collegeId),
     eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
   .groupBy(projectMembers.projectId);
 for(const row of rows)sizes.set(row.projectId,Number(row.total));
 return sizes;
}
