import { boundedRequestJson } from "@/lib/request-body";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { runCollegeFacultyCsv } from "@/modules/people/college-faculty-csv-service";
import { route } from "@/security/route";

export const runtime="nodejs";
async function handlePOST(request:Request){
  if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    return NextResponse.json({
      report:await runCollegeFacultyCsv(await getCurrentRequestContext(),await boundedRequestJson(request, 8 * 1024 * 1024)),
    });
  } catch(error){return apiErrorResponse(error);}
}
export const POST = route(
  { auth: "user", permission: "people.manage", stepUp: true },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
