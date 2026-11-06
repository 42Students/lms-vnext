import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {restoreCollege} from "@/modules/colleges/service";
export const runtime="nodejs";
/** SA-tenants-modules-R02: same-origin, actor-scoped, audited restore. */
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {collegeId}=params;
    const college=await restoreCollege(context,collegeId);
    return NextResponse.json({college});
  },
);
