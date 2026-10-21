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
  const context=await getCurrentRequestContext();
  const page=await listSuperAdminCompanyDirectory(context,{...query,page:1});
  // The legacy browser export included unrestricted contact columns. Keep
  // this authenticated server export restricted to the already-authorized
  // directory projection; private contact fields are intentionally omitted.
  if(page.total===0)return Response.json({error:"NO_COMPANIES_TO_EXPORT",message:"No matching companies to export."},{status:404,headers:{"cache-control":"private, no-store"}});
  const cap=2000;
  const pages=Math.min(40,Math.ceil(page.total/50));
  const extra=await Promise.all(Array.from({length:Math.max(0,pages-1)},(_,index)=>listSuperAdminCompanyDirectory(context,{...query,page:index+2})));
  const rows=[...page.rows,...extra.flatMap(part=>part.rows)].slice(0,cap);
  return new Response(superAdminCompanyCsv(rows),{headers:{
   "content-type":"text/csv; charset=utf-8",
   "content-disposition":'attachment; filename="companies.csv"',
   "cache-control":"no-store",
   "x-export-row-count":String(rows.length),
   "x-export-limit":String(cap),
   "x-export-private-contacts-omitted":"true",
   "x-export-total-matches":String(page.total),
   "x-export-truncated":String(page.total>cap),
   "x-content-type-options":"nosniff",
  }});
 }catch(error){return apiErrorResponse(error);}
}
