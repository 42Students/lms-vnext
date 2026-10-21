import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readTpoSettingsBody,TpoCommunicationBodyError} from "@/modules/placements/tpo-communication-request-model";
import {getPublicJoinPostingPolicy,setPublicJoinPostingPolicy} from "@/modules/placements/tpo-public-join-posting-policy-service";
import {TpoPublicJoinLinkError} from "@/modules/placements/tpo-public-join-link-service";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const search=new URL(request.url).searchParams,keys=[...search.keys()];
  if(keys.length!==new Set(keys).size||keys.some(key=>key!=="scope"&&key!=="companyId"))
   return NextResponse.json({error:"INVALID_QUERY"},{status:400});
  const input=z.discriminatedUnion("scope",[
   z.strictObject({scope:z.literal("COLLEGE")}),
   z.strictObject({scope:z.literal("COMPANY"),companyId:z.string().uuid()}),
  ]).parse(search.get("scope")==="COMPANY"
   ?{scope:"COMPANY",companyId:search.get("companyId")}
   :{scope:search.get("scope"),...(search.has("companyId")?{companyId:search.get("companyId")}:{})});
  const value=await getPublicJoinPostingPolicy(await getCurrentRequestContext(),
   input.scope,input.scope==="COMPANY"?input.companyId:undefined);
  return NextResponse.json(value,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_QUERY"},{status:400});
  if(error instanceof TpoPublicJoinLinkError)return NextResponse.json({error:error.code},{
   status:error.code==="NOT_REGISTERED"?503:404});
  return apiErrorResponse(error);
 }
}
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const value=await setPublicJoinPostingPolicy(await getCurrentRequestContext(),
   await readTpoSettingsBody(request));
  return NextResponse.json(value,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TpoCommunicationBodyError)return NextResponse.json({error:"INVALID_BODY"},{
   status:error.code==="BODY_TOO_LARGE"?413:400});
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:400});
  if(error instanceof TpoPublicJoinLinkError)return NextResponse.json({error:error.code},{
   status:error.code==="NOT_REGISTERED"?503:error.code==="STALE"?409:404});
  return apiErrorResponse(error);
 }
}
