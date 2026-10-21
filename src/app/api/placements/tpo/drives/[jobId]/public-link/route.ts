import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoExternalJobShare,createTpoExternalJobShare} from "@/modules/placements/tpo-public-join-link-service";
export const runtime="nodejs";
type Props={params:Promise<{jobId:string}>};
export async function GET(_request:Request,{params}:Props){
 try{const {jobId}=await params;
  return NextResponse.json(await getTpoExternalJobShare(await getCurrentRequestContext(),jobId),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,{params}:Props){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const {jobId}=await params;
  return NextResponse.json(await createTpoExternalJobShare(await getCurrentRequestContext(),jobId),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
