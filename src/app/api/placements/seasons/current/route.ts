import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getCurrentTpoPlacementSeason} from "@/modules/placements/tpo-season-current-service";
export const runtime="nodejs";
/** Selected TPO membership supplies college identity; no untrusted college ID
 * or numeric legacy season ID is accepted at the public read boundary.
 */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    const state=await getCurrentTpoPlacementSeason(__ctx);
    return NextResponse.json(state,{headers:{"cache-control":"no-store"}});
  },
);
