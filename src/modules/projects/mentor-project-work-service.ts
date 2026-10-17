import "server-only";
import { count, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectTasks } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { hasMembershipRole } from "@/modules/identity/context";
import { ProjectsServiceError } from "./errors";
import { listMyProjectInstances } from "./member-service";

export async function getMentorProjectWorkCounts(context: RequestContext,
 verifiedRows?:readonly Awaited<ReturnType<typeof listMyProjectInstances>>[number][]) {
  if (!hasMembershipRole(context,"MENTOR") || context.user.platformStatus!=="ACTIVE") {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  // Re-read persisted memberships and active role grants, never trust caller-supplied project IDs.
  const projects=(verifiedRows??await listMyProjectInstances(context)).filter(row=>row.memberRole==="MENTOR");
  const ids=projects.map(row=>row.project.id);
  const counts=new Map<string,{total:number;open:number}>();
  if(!ids.length)return counts;
  const rows=await getDb().select({projectId:projectTasks.projectId,total:count(),
      open:sql<number>`count(*) filter (where ${projectTasks.status} <> 'DONE')::int`})
    .from(projectTasks).where(inArray(projectTasks.projectId,ids)).groupBy(projectTasks.projectId);
  for(const row of rows)counts.set(row.projectId,{total:Number(row.total),open:Number(row.open)});
  return counts;
}
