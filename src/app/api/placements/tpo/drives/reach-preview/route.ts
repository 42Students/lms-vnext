import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {readBoundedJsonBody} from "@/lib/bounded-json-body";
import {apiErrorResponse} from "@/lib/api-error";
import {previewDraftDriveTargeting} from "@/modules/placements/tpo-drive-create-reach-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"} as const;
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},
  {status:403,headers:noStore});
 const payload=await readBoundedJsonBody(request,4096);
 if(payload.kind!=="OK")return NextResponse.json({error:"INVALID_REQUEST"},
  {status:payload.kind==="TOO_LARGE"?413:400,headers:noStore});
 try{
  const result=await previewDraftDriveTargeting(
   await getCurrentRequestContext(),payload.value);
  return NextResponse.json(result,{headers:noStore});
 }catch(error){
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_TARGETS"},
   {status:400,headers:noStore});
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store");
  return response;
 }
}
