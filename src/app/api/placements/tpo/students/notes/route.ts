import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {addTpoStudentNotes} from "@/modules/placements/tpo-student-notes-service";
export const runtime="nodejs";
export async function POST(req:Request){
 if(!isSameOriginRequest(req))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{const result=await addTpoStudentNotes(await getCurrentRequestContext(),await req.json());
 return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}})}
 catch(error){return apiErrorResponse(error)}
}
