import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getCollegeDashboardCards} from "@/modules/admin-ui/college-dashboard-cards-service";
import {apiErrorResponse} from "@/lib/api-error";
import {requirePermission} from "@/modules/permissions/policy";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** Read-only compatibility projection of the old college summary controller.
 * College identity comes exclusively from the signed-in membership, never from
 * a request-supplied legacy numeric ID or UUID query parameter. */
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  if([...url.searchParams.keys()].length)
   return NextResponse.json({error:"INVALID_QUERY"},{status:400});
  const context=await getCurrentRequestContext();
  const membership=context.membership;
  if(!membership||membership.status!=="ACTIVE")
   return NextResponse.json({error:"COLLEGE_SCOPE_REQUIRED"},{status:403});
  requirePermission(context,"college.read",{collegeId:membership.collegeId,organizationId:membership.organizationId});
  const snapshot=await getCollegeDashboardCards(context,{});
  const count=(key:string)=>{
   const record=snapshot.cards.find(row=>row.key===key);
   return record?.count??null;
  };
  const data={
   studentCount:count("students"),facultyCount:count("faculty"),
   courseCount:count("course-list"),activeDriveCount:count("jobs"),
  };
  return NextResponse.json({data,...data,scope:{collegeId:membership.collegeId},
   updatedAt:new Date().toISOString()},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
