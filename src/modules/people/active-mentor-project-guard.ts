import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectInstances,projectMembers} from "@/db/schema";

type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

/** COL-people-R01: only an ACTIVE workspace with a current MENTOR link
 * stops suspension. Teaching and advising assignments are not blockers. */
export async function activeMentorProjectCount(tx:Tx,membershipId:string){
 const rows=await tx.select({id:projectMembers.id})
  .from(projectMembers)
  .innerJoin(projectInstances,eq(projectInstances.id,projectMembers.projectId))
  .where(and(eq(projectMembers.membershipId,membershipId),
   eq(projectMembers.role,"MENTOR"),isNull(projectMembers.endedAt),
   eq(projectInstances.status,"ACTIVE")))
  .for("share",{of:projectMembers});
 return rows.length;
}

export function mentorSuspensionMessage(n:number){
 return "Cannot suspend this faculty member: they mentor "+n+
  " active project workspace(s). Reassign those projects to another mentor first.";
}
