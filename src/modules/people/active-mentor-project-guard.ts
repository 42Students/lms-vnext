import "server-only";
import {and,eq,isNull,ne} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances,projectMembers} from "@/db/schema";

type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

/** Legacy mentor guard: any non-ARCHIVED project workspace with an active
 * mentor assignment must be reassigned before suspension. Archived links do
 * not block. Distinct workspace IDs avoid overcounting role aliases.
 */
export async function activeMentorProjectCount(tx:Tx,membershipId:string){
 const rows=await tx.selectDistinct({id:projectInstances.id})
  .from(projectMembers)
  .innerJoin(projectInstances,eq(projectInstances.id,projectMembers.projectId))
  .where(and(eq(projectMembers.membershipId,membershipId),
   eq(projectMembers.role,"MENTOR"),isNull(projectMembers.endedAt),
   ne(projectInstances.status,"ARCHIVED")))
  .for("share",{of:projectMembers});
 return rows.length;
}

export function mentorSuspensionMessage(n:number){
 return "Cannot suspend this faculty member: they mentor "+n+
  " active project workspace(s). Reassign those projects to another mentor first.";
}

export function mentorSuspensionConflict(activeProjectCount:number) {
 const count=Math.max(0,Math.trunc(activeProjectCount));
 const message=mentorSuspensionMessage(count);
 return {error:"FACULTY_HAS_ACTIVE_PROJECTS" as const,
  message,activeProjectCount:count,status:409 as const};
}
