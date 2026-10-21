import "server-only";
import {and,eq,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {projectInstances,projectReleases,projectSprints,projectTasks} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole,isSuperAdmin} from "@/modules/identity/context";
import {ProjectsServiceError} from "./errors";
import {requireProjectReadAccess} from "./access";
const legacyId=z.string().regex(/^[0-9]{1,10}$/).transform(Number)
 .pipe(z.number().int().min(0).max(Number.MAX_SAFE_INTEGER));
const alias=z.string().trim().min(1).max(120);
/** Resolve old integer workspace ID inside an explicitly selected college.
 * Access is rechecked against the resolved UUID before returning any detail.
 */
export async function resolveLegacyProjectIdentity(
 context:RequestContext,rawLegacyId:unknown,raw:{
 releaseKey?:string;sprintKey?:string;taskKey?:string;
 }={},
){
 if(!isSuperAdmin(context)&&
   !["COLLEGE_ADMIN","MENTOR","LEARNER"].some(role=>
     hasMembershipRole(context,role as "COLLEGE_ADMIN"|"MENTOR"|"LEARNER")))
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const collegeId=isSuperAdmin(context)?context.adminScope?.collegeId:context.membership?.collegeId;
 if(!collegeId)throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const numeric=legacyId.parse(rawLegacyId);
 const [project]=await getDb().select({
   id:projectInstances.id,legacyProjectId:projectInstances.legacyProjectId,
 }).from(projectInstances).where(and(eq(projectInstances.collegeId,collegeId),
   eq(projectInstances.legacyProjectId,numeric))).limit(1);
 if(!project)throw new ProjectsServiceError("PROJECT_NOT_FOUND");
 await requireProjectReadAccess(context,project.id);
 const [release]=raw.releaseKey?await getDb().select({
   id:projectReleases.id,
 }).from(projectReleases).where(and(eq(projectReleases.projectId,project.id),
   or(eq(projectReleases.templateKey,alias.parse(raw.releaseKey)),
      eq(projectReleases.legacyReleaseKey,alias.parse(raw.releaseKey))))).limit(1):[];
 const [sprint]=raw.sprintKey?await getDb().select({
   id:projectSprints.id,
 }).from(projectSprints).where(and(eq(projectSprints.projectId,project.id),
   or(eq(projectSprints.templateKey,alias.parse(raw.sprintKey)),
      eq(projectSprints.legacySprintKey,alias.parse(raw.sprintKey))))).limit(1):[];
 const [task]=raw.taskKey?await getDb().select({
   id:projectTasks.id,
 }).from(projectTasks).where(and(eq(projectTasks.projectId,project.id),
   or(eq(projectTasks.templateKey,alias.parse(raw.taskKey)),
      eq(projectTasks.legacyTaskKey,alias.parse(raw.taskKey))))).limit(1):[];
 return {
   projectId:project.id,releaseId:release?.id??null,
   sprintId:sprint?.id??null,taskId:task?.id??null,
 };
}
