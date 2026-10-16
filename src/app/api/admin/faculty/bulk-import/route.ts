import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { importFacultyCsv } from "@/modules/people/faculty-bulk-import-service";
export const runtime="nodejs";
export async function POST(request:Request){
  if(!isSameOriginRequest(request))return Response.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    return Response.json(await importFacultyCsv(context,await request.json()),
      {headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return apiErrorResponse(error);}
}
