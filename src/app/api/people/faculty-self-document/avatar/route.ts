import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {beginOwnFacultyAvatarUpload,confirmOwnFacultyAvatar,readOwnFacultyAvatar}
 from "@/modules/people/faculty-avatar-storage-service";
import { secured } from "@/security/secure-handler";
export const runtime="nodejs";
async function handleGET(){
 try{return NextResponse.json(await readOwnFacultyAvatar(await getCurrentRequestContext()),
   {headers:{"Cache-Control":"private, no-store"}});}
 catch(error){return apiErrorResponse(error);}
}
export const GET = secured(handleGET);
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const raw:unknown=await request.json();
  return NextResponse.json(await beginOwnFacultyAvatarUpload(
    await getCurrentRequestContext(),raw),
    {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = secured(handlePOST, { csrf: "enforce" });
async function handlePATCH(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const raw:unknown=await request.json();
  return NextResponse.json(await confirmOwnFacultyAvatar(
    await getCurrentRequestContext(),raw),
    {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const PATCH = secured(handlePATCH, { csrf: "enforce" });
