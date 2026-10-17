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
  const rows=await listCollegeCompanyDirectory(await getCurrentRequestContext(),parsed.data,{exportAll:true});
  return new Response(collegeCompanyCsv(rows.items),{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="companies.csv"',
    "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
    "X-Export-Truncated":rows.truncated?"true":"false"},
  });
 }catch(error){return apiErrorResponse(error);}
}
