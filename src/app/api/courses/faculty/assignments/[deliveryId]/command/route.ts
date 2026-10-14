import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {commandFacultyAssignment} from "@/modules/courses/faculty-assignment-authoring-service";
export const runtime="nodejs";
export async function POST(request:Request,{params}:{
  params:Promise<{deliveryId:string}>;
}){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    const {deliveryId}=await params;
    const assignment=await commandFacultyAssignment(context,{deliveryId},await request.json());
    return NextResponse.json({assignment});
  }catch(error){return apiErrorResponse(error);}
}
