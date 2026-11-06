import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {updateOwnHrDisplayName} from "@/modules/placements/hr-display-name-service";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const raw:unknown=await request.json();
    const profile=await updateOwnHrDisplayName(context,raw);
    return NextResponse.json({profile});
  },
);
