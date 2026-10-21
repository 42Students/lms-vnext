import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {beginOwnFacultyAvatarUpload,confirmOwnFacultyAvatar,readOwnFacultyAvatar}
 from "@/modules/people/faculty-avatar-storage-service";
export const runtime="nodejs";
export async function GET(){
 try{return NextResponse.json(await readOwnFacultyAvatar(await getCurrentRequestContext()),
   {headers:{"Cache-Control":"private, no-store"}});}
 catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const raw:unknown=await request.json();
  return NextResponse.json(await beginOwnFacultyAvatarUpload(
    await getCurrentRequestContext(),raw),
    {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function PATCH(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const raw:unknown=await request.json();
  return NextResponse.json(await confirmOwnFacultyAvatar(
    await getCurrentRequestContext(),raw),
    {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
