import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getCollegePersonAudit} from "@/modules/people/college-person-audit-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:Request,{params}:{params:Promise<{membershipId:string}>}){
 try{const {membershipId}=await params;
  const kind=new URL(req.url).searchParams.get("kind");
  return NextResponse.json(await getCollegePersonAudit(await getCurrentRequestContext(),membershipId,kind),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return apiErrorResponse(e);}
}
