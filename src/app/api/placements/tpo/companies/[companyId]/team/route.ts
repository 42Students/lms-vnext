import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {mutateTpoCompanyTeam,TpoCompanyTeamError} from "@/modules/placements/tpo-company-team-service";
import {tpoCompanyTeamPostSchema} from "@/modules/placements/tpo-company-team-model";
import {readTpoBulkRequestBody,TpoBulkBodyError} from "@/modules/placements/tpo-bulk-request-body";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{companyId:string}>}){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const {companyId}=await params;
 // Bound the untrusted JSON stream before parsing: message validation alone
 // does not prevent a chunked oversized request from exhausting memory.
 let body:Record<string,unknown>;
 try{body=await readTpoBulkRequestBody(request);}
 catch(error){
  if(error instanceof TpoBulkBodyError)return NextResponse.json({
   error:error.status===413?"REQUEST_TOO_LARGE":
    error.status===415?"UNSUPPORTED_MEDIA_TYPE":"INVALID_BODY",
  },{status:error.status});
  throw error;
 }
 const parsed=tpoCompanyTeamPostSchema.safeParse(body);
 if(!z.string().uuid().safeParse(companyId).success||!parsed.success)
  return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{
  // The merged company-team service exposes an action-based mutation API.
  // Preserve the existing same-origin, validated composer POST without
  // discarding its message or changing the scoped company permission checks.
  return NextResponse.json(await mutateTpoCompanyTeam(
   await getCurrentRequestContext(),companyId,{action:"SEND",body:parsed.data.body,
    idempotencyKey:parsed.data.idempotencyKey}));
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
