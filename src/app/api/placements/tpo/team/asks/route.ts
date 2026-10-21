import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getTpoTeamAskSummary,listOwnTpoTeamAsks,
 listTpoTeamMentions,lookupTpoTeamAsk} from "@/modules/placements/tpo-team-asks-service";

export const runtime="nodejs";
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;
 const view=params.get("view")??"mine";
 if(!["mine","mentions","summary","lookup"].includes(view))
  return NextResponse.json({error:"INVALID_VIEW"},{status:400});
 const limitText=params.get("limit")??"100";
 if(!/^[1-9][0-9]{0,2}$/.test(limitText)||Number(limitText)>200)
  return NextResponse.json({error:"INVALID_LIMIT"},{status:400});
 const allowed=new Set(["view","limit","askId"]);
 if([...params.keys()].some(k=>!allowed.has(k))||
    (view==="lookup")!==params.has("askId"))
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
 try{
  const context=await getCurrentRequestContext();
  const result=view==="summary"?await getTpoTeamAskSummary(context):
   view==="lookup"?await lookupTpoTeamAsk(context,params.get("askId")!):
   view==="mentions"?await listTpoTeamMentions(context,Number(limitText)):
   await listOwnTpoTeamAsks(context,Number(limitText));
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof AuthorizationError)
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof Error&&error.message==="TEAM_ASK_NOT_FOUND")
   return NextResponse.json({error:"NOT_FOUND"},{status:404});
  if(error instanceof Error&&error.message==="TEAM_ASKS_PENDING")
   return NextResponse.json({error:"UNAVAILABLE"},{status:503});
  throw error;
 }
}
