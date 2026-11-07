import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {beginOwnFacultyAvatarUpload,confirmOwnFacultyAvatar,readOwnFacultyAvatar}
 from "@/modules/people/faculty-avatar-storage-service";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    return NextResponse.json(await readOwnFacultyAvatar(__ctx),
   {headers:{"Cache-Control":"private, no-store"}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const raw:unknown=await boundedRequestJson(request);
    return NextResponse.json(await beginOwnFacultyAvatarUpload(
    __ctx,raw),
    {headers:{"Cache-Control":"private, no-store"}});
  },
);
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const raw:unknown=await boundedRequestJson(request);
    return NextResponse.json(await confirmOwnFacultyAvatar(
    __ctx,raw),
    {headers:{"Cache-Control":"private, no-store"}});
  },
);
