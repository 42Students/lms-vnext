import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {changeSuperAdminCollegeCompanyRelationship}
 from "@/modules/placements/super-admin-college-company-action-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{return NextResponse.json(await changeSuperAdminCollegeCompanyRelationship(
  await getCurrentRequestContext(),await request.json()));
 }catch(e){return apiErrorResponse(e);}
}
