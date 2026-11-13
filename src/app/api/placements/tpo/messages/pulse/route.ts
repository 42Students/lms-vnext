import { route } from "@/security/route";
import "server-only";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getTpoMessagesPulse} from "@/modules/placements/tpo-messages-service";
import {apiErrorResponse} from "@/lib/api-error";

import { CACHE } from "@/security/responses";
export const runtime="nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor }) => {
    const context = actor!;
    const pulse=await getTpoMessagesPulse(context);
    const version=JSON.stringify([
   pulse.source,pulse.ready,pulse.total,pulse.unread,pulse.reply,
   pulse.lastId,pulse.lastOccurredAt,
  ]);
    return Response.json({version},{headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
