import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 readTpoSettingsBody,TpoCommunicationBodyError,
} from "@/modules/placements/tpo-communication-request-model";
import {
 listTpoAuditSavedViews,changeTpoAuditSavedView,TpoAuditSavedViewError,
} from "@/modules/placements/tpo-audit-saved-view-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    if(new URL(request.url).searchParams.size!==0)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400,headers:noStore});
    return NextResponse.json(await listTpoAuditSavedViews(__ctx),{
   headers:noStore,
  });
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
const body=await readTpoSettingsBody(request);
return NextResponse.json(await changeTpoAuditSavedView(context,body),{headers:noStore});
} catch(error){
  if(error instanceof TpoCommunicationBodyError)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:error.code==="BODY_TOO_LARGE"?413:400,headers:noStore});
  if(error instanceof TpoAuditSavedViewError){
   const status=error.code==="STORAGE_PENDING"?503:error.code==="VIEW_NOT_FOUND"?404:409;
   return NextResponse.json({error:error.code},{status,headers:noStore});
  }
  return apiErrorResponse(error);
 }
  },
);
