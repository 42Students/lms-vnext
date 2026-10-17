import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {changeSuperAdminCompanyDomain} from "@/modules/placements/super-admin-company-identities-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{return NextResponse.json(await changeSuperAdminCompanyDomain(await getCurrentRequestContext(),await request.json()));}
 catch(error){return apiErrorResponse(error);}
}
