import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {restoreOrganization} from "@/modules/organizations/service";
export const runtime="nodejs";
/** SA-tenants-modules-R02: same-origin, actor-scoped, audited restore. */
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {organizationId}=params;
    const organization=await restoreOrganization(context,organizationId);
    return NextResponse.json({organization});
  },
);
