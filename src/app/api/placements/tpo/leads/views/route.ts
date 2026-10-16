import {NextResponse} from "next/server";
import {ZodError} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listTpoRecruiterSavedViews,changeTpoRecruiterSavedView,TpoSavedViewError}
 from "@/modules/placements/tpo-recruiter-saved-view-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  const result=await listTpoRecruiterSavedViews(await getCurrentRequestContext());
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const result=await changeTpoRecruiterSavedView(await getCurrentRequestContext(),await request.json());
  return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch(e){
  if(e instanceof ZodError)return NextResponse.json({error:"INVALID_SAVED_VIEW"},{status:422});
  if(e instanceof TpoSavedViewError)return NextResponse.json({error:e.code},{status:
   e.code==="STORAGE_PENDING"?503:e.code==="VIEW_NOT_FOUND"?404:e.code==="BAD_ACTION"?422:409});
  return apiErrorResponse(e);
 }
}
