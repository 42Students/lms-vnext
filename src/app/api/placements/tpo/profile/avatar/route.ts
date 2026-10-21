import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {beginOwnTpoAvatarUpload,confirmOwnTpoAvatar,readOwnTpoAvatar}
 from "@/modules/placements/tpo-avatar-service";
export const runtime="nodejs";
export async function GET(){
 try{return NextResponse.json(await readOwnTpoAvatar(await getCurrentRequestContext()),
  {headers:{"Cache-Control":"private, no-store"}});}
 catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{return NextResponse.json(await beginOwnTpoAvatarUpload(await getCurrentRequestContext(),
  await request.json()),{headers:{"Cache-Control":"private, no-store"}});}
 catch(error){return apiErrorResponse(error);}
}
export async function PATCH(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{return NextResponse.json(await confirmOwnTpoAvatar(await getCurrentRequestContext(),
  await request.json()),{headers:{"Cache-Control":"private, no-store"}});}
 catch(error){return apiErrorResponse(error);}
}
