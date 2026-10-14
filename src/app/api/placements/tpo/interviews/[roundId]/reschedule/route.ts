import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {rescheduleTpoInterview} from "@/modules/placements/tpo-interview-reschedule-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{roundId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  if (process.env.DB09_TPO_API_READY !== "DB09_VERIFIED")
    return NextResponse.json({error:"DB09_MIGRATIONS_PENDING"},{status:503,
      headers:{"Cache-Control":"private, no-store, max-age=0"}});
 try{
  const {roundId}=await params;
  return NextResponse.json(await rescheduleTpoInterview(await getCurrentRequestContext(),roundId,await request.json()));
 }catch(error){return apiErrorResponse(error);}
}
