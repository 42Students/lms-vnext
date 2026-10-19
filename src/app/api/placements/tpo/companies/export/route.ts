import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import {apiErrorResponse} from "@/lib/api-error";
import {exportTpoCompanyDirectory,tpoCompaniesQuerySchema} from "@/modules/placements/tpo-companies-view-service";
import {tpoStudentCsvCell} from "@/modules/placements/tpo-students-csv";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function cell(value:unknown):string {
 // Reuse the tested, Unicode- and control-character-safe TPO CSV escape.
 // Leading spaces, BOM or zero-width characters must not bypass the guard.
 return tpoStudentCsvCell(String(value??""));
}

export async function GET(request:Request) {
 try {
  const url=new URL(request.url);
  const context=await getCurrentRequestContext();
  await requireTpoBatchActor(context);
  const collegeId=context.membership?.collegeId??"";
  const parsed=tpoCompaniesQuerySchema.safeParse({
   collegeId,search:url.searchParams.get("search")||undefined,
   sort:url.searchParams.get("sort")||undefined,page:1,pageSize:100,
  });
  if(!parsed.success)return NextResponse.json({error:"INVALID_FILTERS"},{status:422});
  let rows;
  try{rows=await exportTpoCompanyDirectory(context,parsed.data);}
  catch(error){
    if(error instanceof Error&&error.message==="COMPANY_EXPORT_TOO_LARGE")
      return NextResponse.json({error:"EXPORT_TOO_LARGE",
        message:"Narrow the search to 2,000 companies or fewer."},{status:413});
    throw error;
  }
  const header=["Company","Website","Contacts","Drives","Offers","Accepted offers","Confirmed joins","Relationship"];
  const records=rows.map(row=>[
   row.name,row.websiteUrl??"",row.contacts??"Unavailable",row.drives,row.offers,
   row.acceptedOffers,row.confirmedJoinedLearners,
   row.unlinkedLeadGroup?"CRM name only":"Linked employer",
  ].map(cell).join(","));
  return new Response("\uFEFF"+[header.map(cell).join(","),...records].join("\r\n")+"\r\n",{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="' + gridExportFilename("companies", "csv") + '"',
    "Cache-Control":"private, no-store"},
  });
 } catch(error) {return apiErrorResponse(error);}
}
