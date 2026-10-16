import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listHrNotifications} from "@/modules/placements/hr-notifications-service";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  const collegeId=url.searchParams.get("collegeId")??undefined;
  const result=await listHrNotifications(await getCurrentRequestContext(),{
   collegeId,unreadOnly:"false",page:1,q:"",
  });
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
