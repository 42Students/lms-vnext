import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {mutateTpoCompanyTeam,TpoCompanyTeamError} from "@/modules/placements/tpo-company-team-service";
import {tpoCompanyTeamPostSchema} from "@/modules/placements/tpo-company-team-model";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{companyId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {companyId}=await params;
 const parsed=tpoCompanyTeamPostSchema.safeParse(await request.json().catch(()=>null));
 if(!z.string().uuid().safeParse(companyId).success||!parsed.success)
  return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{
  // The merged company-team service exposes an action-based mutation API.
  // Preserve the existing same-origin, validated composer POST without
  // discarding its message or changing the scoped company permission checks.
  return NextResponse.json(await mutateTpoCompanyTeam(
   await getCurrentRequestContext(),companyId,{action:"SEND",body:parsed.data.body}));
 }catch(error){
  if(error instanceof AuthorizationError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:400});
  if(error instanceof TpoCompanyTeamError){
   if(error.code==="STORAGE_PENDING")
    return NextResponse.json({error:"UNAVAILABLE"},{status:503});
   if(error.code==="NOT_FOUND")
    return NextResponse.json({error:"NOT_FOUND"},{status:404});
   if(error.code==="NOT_AUTHORIZED")
    return NextResponse.json({error:"FORBIDDEN"},{status:403});
   if(error.code==="BAD_ACTION")
    return NextResponse.json({error:"INVALID_BODY"},{status:400});
   if(error.code==="STALE")
    return NextResponse.json({error:"CONFLICT"},{status:409});
  }
  throw error;
 }
}
