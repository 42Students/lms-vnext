import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {TPO_AUDIT_KIND_LABELS,formatTpoAuditEventType} from "@/modules/placements/tpo-audit-model";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {tpoAuditCsv} from "@/modules/placements/tpo-audit-csv-model";
import {tpoAuditXlsx} from "@/modules/placements/tpo-audit-xlsx-model";
import {getTpoAuditLog,tpoAuditQuerySchema,type TpoAuditRow} from "@/modules/placements/tpo-audit-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** Page through the actual college-scoped union, never export unfiltered raw history. */
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  const format=url.searchParams.get("format")??"csv";
  if(format!=="csv"&&format!=="xlsx")return new Response(JSON.stringify({
    error:"INVALID_EXPORT_FORMAT",message:"Choose CSV or XLSX.",
  }),{status:422,headers:{"Content-Type":"application/json","Cache-Control":"private, no-store"}});
  const selected=url.searchParams.getAll("id");
  if(selected.length>5000||selected.some(id=>!/^[0-9a-f-]{36}$/i.test(id)))
   return new Response(JSON.stringify({error:"INVALID_SELECTION"}),
    {status:400,headers:{"Content-Type":"application/json","Cache-Control":"private, no-store"}});
  const columnsInput=url.searchParams.get("columns");
  const permitted=["Event","About","Detail","Actor","When"] as const;
  const chosen=columnsInput===null?["Event","Actor","When"]:
   columnsInput.split(",").filter((value):value is typeof permitted[number]=>
    permitted.some(name=>name===value));
  if(chosen.length===0)return new Response(JSON.stringify({
    error:"INVALID_COLUMNS",message:"Choose at least one audit column to export.",
  }),{status:400,headers:{"Content-Type":"application/json","Cache-Control":"private, no-store"}});
  const raw=Object.fromEntries(url.searchParams.entries());
  for(const key of ["page","pageSize","format","columns","id"])delete raw[key];
  const filters=tpoAuditQuerySchema.parse({...raw,page:1,pageSize:100});
  const context=await getCurrentRequestContext();
  const items:TpoAuditRow[]=[];
  let total=0;
  // Legacy bounded export supports up to 5,000 events for a chosen range.
  // Keep the college-scoped union and explicit bounded paging.
  for(let page=1;page<=50;page++){
   const result=await getTpoAuditLog(context,{...filters,page,pageSize:100});
   total=result.summary.total;
   items.push(...result.items);
   if(items.length>=total||result.items.length===0)break;
  }
  const selectedIds=new Set(selected);
  const filtered=selected.length?items.filter(row=>selectedIds.has(row.id)):items;
  const safeCell=(value:string)=>{
    const safe=/^\s*[=+\-@\t\r]/.test(value)?"'"+value:value;
    return '"'+safe.replaceAll('"','""')+'"';
  };
  const exported=columnsInput===null&&selected.length===0?
    tpoAuditCsv(filtered):
    [chosen.map(safeCell).join(","),
     ...filtered.map(row=>chosen.map(column=>{
      switch(column){
       case "Event":return formatTpoAuditEventType(row.eventType);
       case "About":return TPO_AUDIT_KIND_LABELS[row.kind];
       case "Detail":return [row.title,row.detail].filter(Boolean).join(" · ");
       case "Actor":return row.actorName;
       case "When":return new Intl.DateTimeFormat("en-IN",{
        timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
       }).format(new Date(row.occurredAt))+" IST";
      }
     }).map(safeCell).join(","))].join("\r\n")+"\r\n";
  const body=format==="xlsx"?tpoAuditXlsx(filtered,chosen):"\uFEFF"+exported;
  return new Response(body,{headers:{
   "Content-Type":format==="xlsx"?"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="' + gridExportFilename("audit-log", format) + '"',
   "Cache-Control":"private, no-store, max-age=0",
   "X-Content-Type-Options":"nosniff",
   "X-Export-Truncated":items.length<total?"true":"false",
   "X-Export-Selected":String(filtered.length),
   "X-Export-Columns":chosen.join(","),
   "X-Export-Total":String(total),
   "X-Export-Row-Limit":"5000",
   Vary:"Cookie",
  }});
 }catch(error){
  const response=apiErrorResponse(error);
  response.headers.set("Cache-Control","private, no-store, max-age=0");
  return response;
 }
}
