import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listCompanyCommunication,updateCompanyCommunication,CompanyCommunicationUnavailable}
 from "@/modules/placements/tpo-company-communication-service";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    return NextResponse.json(await listCompanyCommunication(__ctx),{
  headers:{"Cache-Control":CACHE.NONE},
 });
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
return NextResponse.json(await updateCompanyCommunication(
  __ctx,await boundedRequestJson(request)));
} catch(e){
  if(e instanceof CompanyCommunicationUnavailable)return NextResponse.json({error:"STORAGE_PENDING"},{status:503});
  if(e instanceof Error&&e.message==="COMPANY_NOT_IN_COLLEGE")
   return NextResponse.json({error:"COMPANY_NOT_FOUND"},{status:404});
  if(e instanceof ZodError)return NextResponse.json({error:"INVALID_COMPANY_STATE"},{status:422});
  return apiErrorResponse(e);
 }
  },
);
