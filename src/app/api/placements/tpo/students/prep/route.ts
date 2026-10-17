import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {TpoPrepError,assignTpoPrepCourse,listTpoPrepCourseOptions} from "@/modules/placements/tpo-prep-assignment-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{return NextResponse.json({courses:await listTpoPrepCourseOptions(await getCurrentRequestContext())},
  {headers:{"Cache-Control":"private, no-store"}});}
 catch(error){if(error instanceof TpoPrepError)return NextResponse.json({error:error.code},{status:503});return apiErrorResponse(error);}
}
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{return NextResponse.json(await assignTpoPrepCourse(await getCurrentRequestContext(),await request.json()),
  {headers:{"Cache-Control":"private, no-store"}});}
 catch(error){if(error instanceof TpoPrepError)return NextResponse.json({error:error.code},{status:error.code==="UNAVAILABLE"?503:409});
  return apiErrorResponse(error);}
}
