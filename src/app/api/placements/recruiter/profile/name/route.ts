import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {updateOwnHrDisplayName} from "@/modules/placements/hr-display-name-service";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "identity.self.manage" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const raw:unknown=await boundedRequestJson(request);
    const profile=await updateOwnHrDisplayName(context,raw);
    return NextResponse.json({profile});
  },
);
