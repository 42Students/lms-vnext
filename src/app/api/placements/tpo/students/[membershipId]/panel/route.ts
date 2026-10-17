import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoStudentPanelDetail} from "@/modules/placements/tpo-student-panel-detail-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
type Props={params:Promise<{membershipId:string}>};
export async function GET(_request:Request,{params}:Props){
 try{
  const {membershipId}=await params;
  const detail=await getTpoStudentPanelDetail(await getCurrentRequestContext(),membershipId);
  if(!detail)return NextResponse.json({error:"STUDENT_NOT_FOUND"},{status:404});
  return NextResponse.json(detail,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
