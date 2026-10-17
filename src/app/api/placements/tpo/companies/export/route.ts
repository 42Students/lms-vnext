import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getTpoCompaniesView,tpoCompaniesQuerySchema} from "@/modules/placements/tpo-companies-view-service";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function cell(value:unknown):string {
 const text=String(value??"");
 // Spreadsheet applications must not evaluate untrusted names or URLs.
 const safe=/^[\t\r\n]*[=+@-]/.test(text)?"'"+text:text;
 return '"'+safe.replaceAll('"','""')+'"';
}

export async function GET(request:Request) {
 try {
  const url=new URL(request.url);
  const context=await getCurrentRequestContext();
  const collegeId=context.membership?.collegeId??"";
  const parsed=tpoCompaniesQuerySchema.safeParse({
   collegeId,search:url.searchParams.get("search")||undefined,
   sort:url.searchParams.get("sort")||undefined,page:1,pageSize:100,
  });
  if(!parsed.success)return NextResponse.json({error:"INVALID_FILTERS"},{status:422});
  const first=await getTpoCompaniesView(context,parsed.data);
  // Explicit ceiling, never silently truncate a directory export.
  if(first.page.total>2000)return NextResponse.json({
   error:"EXPORT_TOO_LARGE",message:"Narrow the search to 2,000 companies or fewer.",
  },{status:413});
  const rows=[...first.page.items];
  for(let page=2;page<=first.page.totalPages;page++){
   const next=await getTpoCompaniesView(context,{...parsed.data,page});
   rows.push(...next.page.items);
  }
  const header=["Company","Website","Contacts","Drives","Offers","Accepted offers","Confirmed joins","Relationship"];
  const records=rows.map(row=>[
   row.name,row.websiteUrl??"",row.contacts??"Unavailable",row.drives,row.offers,
   row.acceptedOffers,row.confirmedJoinedLearners,
   row.unlinkedLeadGroup?"CRM name only":"Linked employer",
  ].map(cell).join(","));
  return new Response("\uFEFF"+[header.map(cell).join(","),...records].join("\r\n")+"\r\n",{
   headers:{"Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="companies.csv"',
    "Cache-Control":"private, no-store"},
  });
 } catch(error) {return apiErrorResponse(error);}
}
