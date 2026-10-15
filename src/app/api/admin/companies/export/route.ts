import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {adminCompaniesQuerySchema} from "@/modules/placements/admin-company-directory-model";
import {listSuperAdminCompanyDirectory} from "@/modules/placements/admin-company-directory-service";
import {superAdminCompanyCsv} from "@/modules/placements/admin-company-directory-export-model";
export const runtime="nodejs";
export async function GET(request:Request){
 try {
  const params=new URL(request.url).searchParams;
  const input:Record<string,string>={};
  for(const [key,value] of params){if(Object.hasOwn(input,key))return Response.json({error:"INVALID_REQUEST"},{status:400});input[key]=value;}
  if(input.collegeId==="")delete input.collegeId;
  const query=adminCompaniesQuerySchema.parse(input);
  const data=await listSuperAdminCompanyDirectory(await getCurrentRequestContext(),query);
  return new Response(superAdminCompanyCsv(data.rows),{headers:{
   "content-type":"text/csv; charset=utf-8",
   "content-disposition":'attachment; filename="super-admin-company-page.csv"',
   "cache-control":"no-store",
   "x-export-row-count":String(data.rows.length),
   "x-export-total-matches":String(data.total),
  }});
 }catch(error){return apiErrorResponse(error);}
}
