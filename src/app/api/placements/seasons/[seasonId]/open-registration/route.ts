import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {changeTpoSeasonRegistration} from "@/modules/placements/tpo-season-write-service";

export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{seasonId:string}>}){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const {seasonId}=await params;
    const raw:unknown=await request.json();
    if(!raw||typeof raw!=="object"||Array.isArray(raw))
      return NextResponse.json({error:"INVALID_INPUT"},{status:400});
    const payload={...raw,seasonId};
    const season=await changeTpoSeasonRegistration(await getCurrentRequestContext(),payload);
    return NextResponse.json({season},{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return apiErrorResponse(error);}
}
