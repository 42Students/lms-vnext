import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getOrganizationApplicationStats} from "@/modules/placements/organization-application-search-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{
  const requested=new URL(request.url).searchParams.get("organizationId");
  const stats=await getOrganizationApplicationStats(await getCurrentRequestContext(),
   requested?{organizationId:requested}:{});
  return NextResponse.json(stats,{headers:{"Cache-Control":"private, no-store"}});
 }catch(problem){return apiErrorResponse(problem);}
}
