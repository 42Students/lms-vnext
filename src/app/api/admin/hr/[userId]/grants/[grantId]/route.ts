import { route } from "@/security/route";
import { requireRecentDeviceAuthentication } from "@/auth/recent-device-auth";
import {
  revokeSuperAdminHrCollegeAccess,
} from "@/modules/placements/super-admin-hr-service";

import { privateJson } from "@/security/responses";
export const runtime = "nodejs";

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {
      userId,
      grantId,
    } = params;
    await requireRecentDeviceAuthentication(context.user.id);
    const grant =
      await revokeSuperAdminHrCollegeAccess(
        context,
        userId,
        grantId,
      );
    return privateJson({ grant });
  },
);
