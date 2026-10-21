import {
  hasMembershipRole,
  hasActiveMembership,
  isSuperAdmin,
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
  modules?: Record<"projects"|"placements"|"electives", boolean>;
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
      modules: {
        projects: modules.projects.enabled,
        placements: modules.placements.enabled,
        electives: modules.electives.enabled,
      },
    };
  } catch {
    return {
      projectsEnabled: false,
      placementsEnabled: false,
      driveDayEnabled: false,
      modules: { projects:false,placements:false,electives:false },
    };
  }
}

/**
 * Legacy FeatureFlagController role-wide "my college" read adapter.
 * Only authenticated, active membership (or deliberately selected acting
 * college for Super Admin) can influence the scope chain. Unscoped SA must
 * choose a college before this endpoint can claim college module decisions.
 *
 * The existing learner shell helper remains fail-closed by design; unlike
 * that convenience navigation read, this API exposes resolver outages as a
 * distinct typed status instead of misreporting "all modules disabled".
 */
export type PrincipalModuleFlagResult =
 | {ok:true;status:"OK";message:"OK";flags:{
     projectsEnabled:boolean;placementsEnabled:boolean;driveDayEnabled:boolean;
     modules:Record<"projects"|"placements"|"electives",boolean>;
   }}
 | {ok:false;status:"NOT_AUTHENTICATED"|"COLLEGE_SCOPE_REQUIRED"|"RESOLVER_UNAVAILABLE";
     message:string};

export async function getPrincipalModuleFlags(
  context:RequestContext|null,
):Promise<PrincipalModuleFlagResult>{
  if(!context || context.user.platformStatus!=="ACTIVE")
    return {ok:false,status:"NOT_AUTHENTICATED",message:"Authenticated session required."};
  if(!hasActiveMembership(context)&&
     !(isSuperAdmin(context)&&context.adminScope?.collegeId))
    return {ok:false,status:"COLLEGE_SCOPE_REQUIRED",
      message:"Select an active college membership or acting-college scope."};
  try{
    const chain=await buildModuleAccessChain(context);
    const resolved=await resolveOptionalModuleAccessForChain(chain);
    const learner=hasMembershipRole(context,"LEARNER");
    const [participation,coordinator]=await Promise.all([
      learner&&resolved.placements.enabled
        ?resolveLearnerPlacementParticipation(context,chain)
        :Promise.resolve(null),
      learner?hasStudentCoordinatorAssignmentToday(context):Promise.resolve(false),
    ]);
    const flags={
      projectsEnabled:resolved.projects.enabled,
      placementsEnabled:resolved.placements.enabled &&
        (!learner || participation?.status==="ELIGIBLE"),
      driveDayEnabled:coordinator,
      modules:{
        projects:resolved.projects.enabled,
        placements:resolved.placements.enabled,
        electives:resolved.electives.enabled,
      },
    };
    return {ok:true,status:"OK",message:"OK",flags};
  }catch{
    return {ok:false,status:"RESOLVER_UNAVAILABLE",
      message:"College module access could not be resolved. Retry later."};
  }
}
