import "server-only";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {placementReportCsv} from "@/modules/placements/report-model";
import {listAdminFacultyAssignments} from "./super-admin-faculty-assignments-service";
import {superAdminReadQuerySchema} from "./super-admin-read-directory-model";
const columns=["Faculty","Course","Class","Semester","Year","Role","Active"] as const;
export async function exportSuperAdminFacultyAssignments(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const entries=[...params.entries()];
  // Object.fromEntries collapses duplicate query keys. Reject ambiguous
  // filters rather than silently choosing the attacker's final selector.
  const raw=Object.fromEntries(entries);
  const duplicate=entries.length!==Object.keys(raw).length;
  const parsed=duplicate?null:superAdminReadQuerySchema.safeParse(raw);
  if(!parsed?.success||!["ALL","ACTIVE","ENDED"].includes(parsed.data.status))
   return Response.json({error:"INVALID_ASSIGNMENT_FILTERS"},{status:400});
  const context=await getCurrentRequestContext();
  const rows:(string|number)[][]=[];
  let total=0;
  for(let page=1;page<=3;page++){
   const result=await listAdminFacultyAssignments(context,{...parsed.data,page,pageSize:100});
   total=result.total;
   const field=(parts:readonly string[],key:string)=>parts.find(p=>p.startsWith(key+": "))?.slice(key.length+2)??"";
   for(const item of result.items)rows.push([
    item.title,item.subtitle,field(item.details,"Class"),field(item.details,"Semester"),
    field(item.details,"Year"),field(item.details,"Teaching role"),field(item.details,"Active"),
   ]);
   if(page>=result.totalPages)break;
  }
  const cap=300;
  if(total>cap)rows.push(["TRUNCATED: showing first 300 assignments","Narrow filters to export remaining rows."]);
  return new Response("\uFEFF"+placementReportCsv(columns,rows),{headers:{
   "Content-Type":"text/csv; charset=utf-8","Cache-Control":"private, no-store",
   "Content-Disposition":'attachment; filename="faculty-assignments.csv"',
   "X-Export-Truncated":String(total>cap),"X-Content-Type-Options":"nosniff",
  }});
 }catch(error){return apiErrorResponse(error);}
}
