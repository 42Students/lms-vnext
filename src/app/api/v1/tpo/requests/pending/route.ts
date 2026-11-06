import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getLegacyTpoPendingRequests} from "@/modules/placements/tpo-global-requests-service";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    const requests=await getLegacyTpoPendingRequests(__ctx);
    return NextResponse.json(requests,{headers:{"Cache-Control":"private, no-store"}});
  },
);
