import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listTpoStudentSavedViews,mutateTpoStudentSavedView}
 from "@/modules/placements/tpo-student-saved-views-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{return NextResponse.json(await listTpoStudentSavedViews(await getCurrentRequestContext()),
  {headers:{"Cache-Control":"private, no-store"}})}
 catch(error){return apiErrorResponse(error)}
}
export async function POST(req:Request){
 if(!isSameOriginRequest(req))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{return NextResponse.json(await mutateTpoStudentSavedView(await getCurrentRequestContext(),await req.json()),
  {headers:{"Cache-Control":"private, no-store"}})}
 catch(error){return apiErrorResponse(error)}
}
