import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {setMyTpoTeamAway,tpoTeamAwaySchema} from "@/modules/placements/tpo-team-away-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const input=tpoTeamAwaySchema.safeParse(await request.json().catch(()=>null));
 if(!input.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{return NextResponse.json(await setMyTpoTeamAway(await getCurrentRequestContext(),input.data));}
 catch(error){
  if(error instanceof AuthorizationError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:400});
  if(error instanceof Error&&["TEAM_AWAY_STALE","TEAM_AWAY_INVALID_DATE"].includes(error.message))
   return NextResponse.json({error:"STALE_MESSAGE"},{status:409});
  if(error instanceof Error&&error.message==="TEAM_AWAY_PENDING")
   return NextResponse.json({error:"UNAVAILABLE"},{status:503});
  throw error;
 }
}
