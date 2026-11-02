import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {changeSuperAdminCollegeCompanyRelationship}
 from "@/modules/placements/super-admin-college-company-action-service";
import {readBoundedJsonRequest} from "@/lib/bounded-json-request";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const parsed=await readBoundedJsonRequest(request,8192);
  if(!parsed.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  return NextResponse.json(await changeSuperAdminCollegeCompanyRelationship(
   await getCurrentRequestContext(),parsed.value));
 }catch(e){return apiErrorResponse(e);}
}
