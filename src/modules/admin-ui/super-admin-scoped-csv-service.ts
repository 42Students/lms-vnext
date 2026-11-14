import "server-only";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requireRecentDeviceAuthentication} from "@/auth/recent-device-auth";
import {apiErrorResponse} from "@/lib/api-error";
import type {RequestContext} from "@/modules/identity/context";
import type {SuperAdminReadQuery,SuperAdminReadResult} from "./super-admin-read-directory-model";
import {SUPER_ADMIN_READ_PAGE_SIZE} from "./super-admin-read-directory-model";
import {SUPER_ADMIN_SCOPED_CSV_CAP,buildSuperAdminScopedCsv,parseSuperAdminScopedCsvParams,scopedCsvStatusAllowed} from "./super-admin-scoped-csv-model";
import { CACHE } from "@/security/responses";
import { attachmentHeader } from "@/security/downloads";
type DirectoryLoader=(context:RequestContext,query:SuperAdminReadQuery)=>Promise<SuperAdminReadResult>;
export async function exportSuperAdminScopedDirectory(request:Request,config:{
 filename:string;statuses:readonly string[];loader:DirectoryLoader;
}):Promise<Response>{
 try{
  const context=await getCurrentRequestContext();
  // Bulk roster exports require fresh server-verified authentication.
  await requireRecentDeviceAuthentication(context.user.id);
  const query=parseSuperAdminScopedCsvParams(new URL(request.url).searchParams);
  if(!scopedCsvStatusAllowed(query.status,config.statuses)){
   return Response.json({error:"UNSUPPORTED_EXPORT_STATUS"},{status:400,
    headers:{"Cache-Control":CACHE.PRIVATE,"X-Content-Type-Options":"nosniff"}});
  }
  // CSV always uses fixed 25-row chunks. A manually edited pageSize=10
  // previously fetched only 100 of the promised first 250 matching records;
  // pageSize=100 over-fetched up to 1,000 rows. Never let URL paging
  // parameters change the export's capped, consistently ordered window.
  const exportQuery={...query,pageSize:SUPER_ADMIN_READ_PAGE_SIZE};
  const first=await config.loader(context,{...exportQuery,page:1});
  const pages=Math.min(Math.ceil(SUPER_ADMIN_SCOPED_CSV_CAP/SUPER_ADMIN_READ_PAGE_SIZE),Math.ceil(first.total/SUPER_ADMIN_READ_PAGE_SIZE));
  const rest=await Promise.all(Array.from({length:Math.max(0,pages-1)},(_,index)=>
   config.loader(context,{...exportQuery,page:index+2})));
  const rows=[...first.items,...rest.flatMap(page=>page.items)].slice(0,SUPER_ADMIN_SCOPED_CSV_CAP);
  const truncated=first.total>SUPER_ADMIN_SCOPED_CSV_CAP;
  return new Response(buildSuperAdminScopedCsv(rows,truncated),{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":attachmentHeader(`${config.filename}`),
   "Cache-Control":CACHE.PRIVATE,"X-Content-Type-Options":"nosniff",
   "X-Export-Row-Cap":String(SUPER_ADMIN_SCOPED_CSV_CAP),
   "X-Export-Truncated":String(truncated),
  }});
 }catch(error){return apiErrorResponse(error);}
}
