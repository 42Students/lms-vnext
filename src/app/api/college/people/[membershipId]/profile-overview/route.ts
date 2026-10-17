import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getCollegePersonProfileOverview} from "@/modules/people/college-person-profile-overview-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req:Request,{params}:{params:Promise<{membershipId:string}>}){
 try{
  const {membershipId}=await params;
  const kind=new URL(req.url).searchParams.get("kind");
  return NextResponse.json(await getCollegePersonProfileOverview(
   await getCurrentRequestContext(),membershipId,kind),
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
