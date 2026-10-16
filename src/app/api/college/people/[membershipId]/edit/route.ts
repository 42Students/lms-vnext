import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getCollegePersonEditor,saveCollegePersonEditor} from "@/modules/people/college-directory-person-editor-service";

export const runtime="nodejs";
type Params={params:Promise<{membershipId:string}>};
export async function GET(request:Request,{params}:Params){
  try{
    const context=await getCurrentRequestContext(),{membershipId}=await params;
    const kind=z.enum(["FACULTY","LEARNER"]).parse(new URL(request.url).searchParams.get("kind"));
    const person=await getCollegePersonEditor(context,membershipId,kind);
    return NextResponse.json({person},{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return apiErrorResponse(error);}
}
export async function PATCH(request:Request,{params}:Params){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext(),{membershipId}=await params;
    return NextResponse.json({person:await saveCollegePersonEditor(
      context,membershipId,await request.json())});
  }catch(error){return apiErrorResponse(error);}
}
