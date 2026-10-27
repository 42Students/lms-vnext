import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {TpoGeneralRequestError,listTpoGeneralRequests} from "@/modules/placements/tpo-general-request-service";
import {tpoGeneralReviewQuerySchema} from "@/modules/placements/tpo-general-request-model";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  for(const key of ["page","pageSize","status","kind","q"]){
   if(params.getAll(key).length>1)
    return NextResponse.json({error:"Repeated review filter"},{status:400});
  }
  if([...params.keys()].some(key=>!["page","pageSize","status","kind","q"].includes(key)))
   return NextResponse.json({error:"Unknown review filter"},{status:400});
  const parsed=tpoGeneralReviewQuerySchema.safeParse(Object.fromEntries(params));
  if(!parsed.success)
   return NextResponse.json({error:"Invalid review filters"},{status:400});
  return NextResponse.json(await listTpoGeneralRequests(await getCurrentRequestContext(),parsed.data),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TpoGeneralRequestError&&error.code==="UNAVAILABLE")
   return NextResponse.json({error:"REQUESTS_NOT_READY"},{status:503});
  return apiErrorResponse(error);
 }
}
