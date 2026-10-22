import {NextResponse} from "next/server";
import {z,ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {readBoundedJsonBody} from "@/lib/bounded-json-body";
import {apiErrorResponse} from "@/lib/api-error";
import {initiateTpoJdUpload,saveTpoJdUpload} from "@/modules/placements/tpo-jd-upload-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"} as const;
type Ctx={params:Promise<{jobId:string}>};
const discriminator=z.object({action:z.enum(["INITIATE","CONFIRM","REMOVE"])});
export async function POST(request:Request,{params}:Ctx){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},
  {status:403,headers:noStore});
 const body=await readBoundedJsonBody(request,4096);
 if(body.kind!=="OK")return NextResponse.json({error:"INVALID_REQUEST"},
  {status:body.kind==="TOO_LARGE"?413:400,headers:noStore});
 try{
  const input=discriminator.parse(body.value);
  const {jobId}=await params;
  const ctx=await getCurrentRequestContext();
  const result=input.action==="INITIATE"?
   await initiateTpoJdUpload(ctx,jobId,body.value):
   await saveTpoJdUpload(ctx,jobId,body.value);
  return NextResponse.json(result,{status:input.action==="INITIATE"?201:200,headers:noStore});
 }catch(error){
  if(error instanceof ZodError)return NextResponse.json({error:"INVALID_DOCUMENT_REQUEST"},
   {status:400,headers:noStore});
  if(error instanceof Error&&["JD_FILE_TYPE_INVALID","JD_FILE_SIZE_INVALID"].includes(error.message))
   return NextResponse.json({error:error.message},{status:400,headers:noStore});
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store");
  return response;
 }
}
