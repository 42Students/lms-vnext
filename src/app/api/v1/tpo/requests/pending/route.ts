import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getLegacyTpoPendingRequests} from "@/modules/placements/tpo-global-requests-service";
import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    try {
const requests=await getLegacyTpoPendingRequests(__ctx);
return privateJson(requests);
} catch(error){
  if(error instanceof RangeError)return NextResponse.json({error:"PENDING_REQUESTS_PAGINATION_REQUIRED"},{status:409});
  return apiErrorResponse(error);
 }
  },
);
