import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
import { importFacultyCsv } from "@/modules/people/faculty-bulk-import-service";
export const runtime="nodejs";
export async function POST(request:Request){
  if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    // CSV can be 1.5 MB of text; cap the actual incoming JSON stream
    // before opening the selected-college identity and onboarding flow.
    const command=await readBoundedJsonRequest(request,4_000_000);
    if(!command.ok)return Response.json({error:"INVALID_REQUEST"},{status:400});
    const context=await getCurrentRequestContext();
    return Response.json(await importFacultyCsv(context,command.value),
      {headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return apiErrorResponse(error);}
}
