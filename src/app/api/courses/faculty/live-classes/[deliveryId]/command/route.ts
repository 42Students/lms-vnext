import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {commandFacultyLiveClass} from "@/modules/courses/faculty-live-mutation-service";

export const runtime="nodejs";
export async function POST(request:Request,{params}:{
  params:Promise<{deliveryId:string}>;
}) {
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    const result=await commandFacultyLiveClass(
      await getCurrentRequestContext(),await params,await request.json());
    return NextResponse.json({result});
  }catch(error){return apiErrorResponse(error);}
}
