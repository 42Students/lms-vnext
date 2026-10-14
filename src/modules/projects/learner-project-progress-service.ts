import { inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { projectTasks } from "@/db/schema";
import { hasActiveMembership, hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { ProjectsServiceError } from "./errors";
import { listMyProjectInstances } from "./member-service";
import { summarizeLearnerProjectProgress } from "./learner-project-progress-model";

const projectIdsSchema = z.array(z.string().uuid()).max(2000);
export async function listMyLearnerProjectProgress(
  context: RequestContext, rawIds: unknown,
) {
  if (!hasActiveMembership(context) || !hasMembershipRole(context,"LEARNER"))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const requested = projectIdsSchema.parse(rawIds);
  const own = await listMyProjectInstances(context);
  const eligible = new Set(own.filter(row=>row.memberRole==="LEARNER")
    .map(row=>row.project.id));
  const ids = [...new Set(requested.filter(id=>eligible.has(id)))];
  if (!ids.length) return [];
  const tasks = await getDb().select({
    projectId:projectTasks.projectId,status:projectTasks.status,
  }).from(projectTasks).where(inArray(projectTasks.projectId,ids));
  return summarizeLearnerProjectProgress(ids,tasks);
}
