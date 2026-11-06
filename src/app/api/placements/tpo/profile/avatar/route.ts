import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {beginOwnTpoAvatarUpload,confirmOwnTpoAvatar,readOwnTpoAvatar}
 from "@/modules/placements/tpo-avatar-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handleGET(){
 try{return NextResponse.json(await readOwnTpoAvatar(await getCurrentRequestContext()),
  {headers:{"Cache-Control":"private, no-store"}});}
 catch(error){return apiErrorResponse(error);}
}
export const GET = secured(handleGET);
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{return NextResponse.json(await beginOwnTpoAvatarUpload(await getCurrentRequestContext(),
  await request.json()),{headers:{"Cache-Control":"private, no-store"}});}
 catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
async function handlePATCH(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{return NextResponse.json(await confirmOwnTpoAvatar(await getCurrentRequestContext(),
  await request.json()),{headers:{"Cache-Control":"private, no-store"}});}
 catch(error){return apiErrorResponse(error);}
}
export const PATCH = secured(handlePATCH, { csrf: "enforce" });
