import { route } from "@/security/route";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {markPlacementCellNoticeRead} from "@/modules/announcements/placement-cell-receipt-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "placements.read" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const {noticeId}=params;
    return Response.json(await markPlacementCellNoticeRead(__ctx,noticeId),
    {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
