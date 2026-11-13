import { route } from "@/security/route";

import {getCollegeLearnerPlacementSummary} from "@/modules/placements/college-application-detail-service";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";
/** Legacy learner summary across all selected-college jobs. Never resolve
 * a candidate solely by a user ID, email, or caller-provided college. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {membershipId}=params;
    const portfolio=await getCollegeLearnerPlacementSummary(context,membershipId);
    return privateJson({portfolio});
  },
);
