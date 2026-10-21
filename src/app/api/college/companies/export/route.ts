import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {parseCollegeCompaniesQuery} from "@/modules/placements/college-company-directory-model";
import {listCollegeCompanyDirectory} from "@/modules/placements/college-company-directory-service";
import {collegeCompanyCsv} from "@/modules/placements/college-directory-csv";
export const runtime="nodejs";
export async function GET(request:Request) {
 try{
  const raw=Object.fromEntries(new URL(request.url).searchParams);
  const parsed=parseCollegeCompaniesQuery(raw);
  if(!parsed.success)return NextResponse.json({error:"INVALID_COMPANY_FILTERS"},{status:400});
  const context=await getCurrentRequestContext();
  const first=await listCollegeCompanyDirectory(context,parsed.data,{exportAll:true});
  const all=[...first.items];
  // Legacy exported the whole current college scope. Continue bounded,
  // deterministic windows, never returning an apparently complete partial CSV.
  while(all.length<first.total){
   const batch=await listCollegeCompanyDirectory(context,parsed.data,{exportAll:true,exportOffset:all.length});
   if(batch.items.length===0)break;
   all.push(...batch.items);
  }
  const incomplete=all.length<first.total;
  return new Response(collegeCompanyCsv(all),{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="companies.csv"',
    "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
    "X-Export-Scope":"COLLEGE_COMPANY_RELATIONSHIP",
    "X-Export-Contact-Fields":"UNAVAILABLE_IN_CURRENT_SCHEMA",
    "X-Export-Truncated":incomplete?"true":"false",
    "X-Export-Total":String(first.total),
    "X-Export-Included":String(all.length)},
  });
 }catch(error){return apiErrorResponse(error);}
}
