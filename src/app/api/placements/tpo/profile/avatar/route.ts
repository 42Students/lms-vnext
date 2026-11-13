import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {beginOwnTpoAvatarUpload,confirmOwnTpoAvatar,readOwnTpoAvatar}
 from "@/modules/placements/tpo-avatar-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    return NextResponse.json(await readOwnTpoAvatar(__ctx),
  {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    return NextResponse.json(await beginOwnTpoAvatarUpload(__ctx,
  await boundedRequestJson(request)),{headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    return NextResponse.json(await confirmOwnTpoAvatar(__ctx,
  await boundedRequestJson(request)),{headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
