import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getCohortCreationPreflight} from "@/modules/projects/cohort-preflight-service";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const result=await getCohortCreationPreflight(await getCurrentRequestContext(),{
   collegeId:params.get("collegeId"),classId:params.get("classId"),templateId:params.get("templateId"),
  });
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
