import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import {
  buildModuleAccessChain,
  resolveOptionalModuleAccessForChain,
} from "@/modules/module-access/service";
import { resolveLearnerPlacementParticipation } from "@/modules/placements/access-service";
import { hasStudentCoordinatorAssignmentToday } from "@/modules/placements/drive-day-coordinator-service";

export type LearnerShellAccess = {
  projectsEnabled: boolean;
  placementsEnabled: boolean;
  driveDayEnabled: boolean;
};

export async function getLearnerShellAccess(
  context: RequestContext,
): Promise<LearnerShellAccess | null> {
  if (!hasMembershipRole(context, "LEARNER")) return null;

  try {
    const chain = await buildModuleAccessChain(context);
    const modules =
      await resolveOptionalModuleAccessForChain(chain);
    const [
      placementParticipation,
      driveDayEnabled,
    ] = await Promise.all([
      modules.placements.enabled
        ? resolveLearnerPlacementParticipation(
            context,
            chain,
          )
        : Promise.resolve(null),
      hasStudentCoordinatorAssignmentToday(
        context,
      ),
    ]);

    return {
      projectsEnabled: modules.projects.enabled,
      placementsEnabled:
        modules.placements.enabled &&
        placementParticipation?.status === "ELIGIBLE",
      driveDayEnabled,
    };
  } catch {
    return {
      projectsEnabled: false,
      placementsEnabled: false,
      driveDayEnabled: false,
    };
  }
}
