import "server-only";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { projectTasks } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { hasActiveMembership, hasMembershipRole } from "@/modules/identity/context";
import { listMyProjectInstances } from "./member-service";
import { ProjectsServiceError } from "./errors";

/** LEARNER-projects-01: derive due state from incomplete project tasks until
 * the orchestrator promotes workspace-level due metadata.
 */
export async function listMyLearnerProjectDueStates(context: RequestContext, rawProjectIds: unknown) {
  if (!hasActiveMembership(context) || !hasMembershipRole(context, "LEARNER"))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const ids = z.array(z.string().uuid()).max(2000).parse(rawProjectIds);
  const own = await listMyProjectInstances(context);
  const eligible = new Set(own.filter(row => row.memberRole === "LEARNER").map(row => row.project.id));
  const scoped = [...new Set(ids.filter(id => eligible.has(id)))];
  if (!scoped.length) return [];
  const tasks = await getDb().select({
    projectId: projectTasks.projectId,
    dueDate: projectTasks.dueDate,
    status: projectTasks.status,
  }).from(projectTasks).where(inArray(projectTasks.projectId, scoped));
  // Linear in the number of tasks and requested projects. Filtering/sorting the
  // entire task set separately for each project was O(projects * tasks log tasks)
  // and became expensive on 1,000+ learner-project dashboards.
  const nearestByProject=new Map<string,string>();
  for(const task of tasks){
    if(task.status==="DONE" || !task.dueDate || !scoped.includes(task.projectId))continue;
    const due=String(task.dueDate);
    const earlier=nearestByProject.get(task.projectId);
    if(earlier===undefined || due<earlier)nearestByProject.set(task.projectId,due);
  }
  const now=new Date();
  return scoped.map(projectId=>{
    const nearest=nearestByProject.get(projectId)??null;
    const dueAt=nearest?new Date(nearest+"T23:59:59+05:30"):null;
    const days=dueAt?(dueAt.getTime()-now.getTime())/86400000:null;
    return {projectId,date:nearest,state:days===null?"No due date":
      days<0?"Overdue":days<=3?"Due soon":"Due date"};
  });
}
