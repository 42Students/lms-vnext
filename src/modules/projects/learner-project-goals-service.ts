import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { projectTemplateVersions } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requireProjectReadAccess } from "./access";
import { ProjectsServiceError } from "./errors";
import { projectTemplateBlueprintSchema } from "./validation";
import { learnerProjectGoalSummary } from "./learner-project-goals-model";

/** Read only the immutable template version assigned to this authorized learner Project. */
export async function getLearnerProjectGoals(
  context: RequestContext, projectId: string,
) {
  const scope=await requireProjectReadAccess(context,projectId);
  if(scope.access!=="LEARNER")throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const [version]=await getDb().select({
    blueprint:projectTemplateVersions.blueprint,
  }).from(projectTemplateVersions).where(and(
    eq(projectTemplateVersions.id,scope.project.templateVersionId),
    eq(projectTemplateVersions.templateId,scope.project.templateId),
  )).limit(1);
  if(!version)throw new ProjectsServiceError("PROJECT_TEMPLATE_VERSION_NOT_FOUND");
  const authored=projectTemplateBlueprintSchema.parse(version.blueprint);
  return learnerProjectGoalSummary(authored);
}
