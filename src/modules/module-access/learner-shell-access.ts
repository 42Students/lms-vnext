import {
  hasMembershipRole,
  type RequestContext,
} from "@/modules/identity/context";
import {
  buildModuleAccessChain,
  resolveOptionalModuleAccessForChain,
} from "@/modules/module-access/service";
import { resolveLearnerPlacementParticipation } from "@/modules/placements/access-service";

export type LearnerShellAccess = {
  projectsEnabled: boolean;
  placementsEnabled: boolean;
};

export async function getLearnerShellAccess(
  context: RequestContext,
): Promise<LearnerShellAccess | null> {
  if (!hasMembershipRole(context, "LEARNER")) return null;

  try {
    const chain = await buildModuleAccessChain(context);
    const modules =
      await resolveOptionalModuleAccessForChain(chain);
    const placementParticipation =
      modules.placements.enabled
        ? await resolveLearnerPlacementParticipation(
            context,
            chain,
          )
        : null;

    return {
      projectsEnabled: modules.projects.enabled,
      placementsEnabled:
        modules.placements.enabled &&
        placementParticipation?.status === "ELIGIBLE",
    };
  } catch {
    return {
      projectsEnabled: false,
      placementsEnabled: false,
    };
  }
}
