import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoPlacementTeam} from "@/modules/placements/tpo-settings-people-service";
import {setCollegeCgpaConversionRule} from "@/modules/profile-verification/settings-service";
export const runtime="nodejs";
const body=z.strictObject({
 rule:z.enum(["X9_5","MINUS_0_5_X10","MINUS_0_75_X10","X10"]),
});
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const length=Number(request.headers.get("content-length")??"0");
 if(!Number.isFinite(length)||length>1000)
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
 try{
  const raw=await request.text();
  if(raw.length>1000)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const context=await getCurrentRequestContext();
  if(!context.membership)
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  const team=await getTpoPlacementTeam(context,context.membership.collegeId);
  const member=team.members.find(row=>row.membershipId===context.membership?.id);
  if(!member?.roles.includes("TPO_ADMIN")&&!member?.roles.includes("COLLEGE_ADMIN"))
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
  const rule=body.parse(JSON.parse(raw)).rule;
  const result=await setCollegeCgpaConversionRule(context,context.membership.collegeId,rule);
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
