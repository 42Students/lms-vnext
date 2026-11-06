import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listTpoRecruiterSavedViews,changeTpoRecruiterSavedView,TpoSavedViewError}
 from "@/modules/placements/tpo-recruiter-saved-view-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    const result=await listTpoRecruiterSavedViews(__ctx);
    return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const result=await changeTpoRecruiterSavedView(__ctx,await request.json());
    return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
  },
);
