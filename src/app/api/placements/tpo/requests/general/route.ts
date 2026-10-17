import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {TpoGeneralRequestError,listTpoGeneralRequests} from "@/modules/placements/tpo-general-request-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{return NextResponse.json({requests:await listTpoGeneralRequests(await getCurrentRequestContext())},
  {headers:{"Cache-Control":"private, no-store"}});}
 catch(error){
  if(error instanceof TpoGeneralRequestError&&error.code==="UNAVAILABLE")
   return NextResponse.json({error:"REQUESTS_NOT_READY"},{status:503});
  return apiErrorResponse(error);
 }
}
