import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoDriveLifecycleList} from "./tpo-drive-lifecycle-list-service";
import {tpoDriveLifecycleQuerySchema} from "./tpo-drive-lifecycle-list-model";
import {placementReportCsv} from "./report-model";

const MAX_PAGES=1000; // 25,000 matching drives, far beyond the page preview.
export async function exportTpoDriveLifecycle(context:RequestContext,raw:unknown){
 const input=raw&&typeof raw==="object"&&!Array.isArray(raw)?
  raw as Record<string,unknown>:{};
 const scope=input.scope==="PAGE"?"PAGE":"ALL";
 const {scope:_scope,...rest}=input;
 const query=tpoDriveLifecycleQuerySchema.parse(rest);
 const first=await getTpoDriveLifecycleList(context,scope==="ALL"?{...query,page:1}:query);
 const all=scope==="PAGE"?[first]:[];
 if(scope==="ALL"){
  if(first.totalPages>MAX_PAGES)throw Error("This export exceeds 25,000 drives. Narrow the filters before exporting.");
  all.push(first);
  for(let page=2;page<=first.totalPages;page++){
   all.push(await getTpoDriveLifecycleList(context,{...query,page}));
  }
 }
 if(query.view==="REQUESTS"){
  const rows=all.flatMap(p=>p.requestRows);
  return {fileName:"drives-requests.csv",csv:placementReportCsv([
   "Request ID","Company","Role","Status","Requested at (UTC)","Approved draft ID",
  ],rows.map(r=>[r.id,r.company,r.title,r.status,r.createdAt,r.approvedJobId]))};
 }
 const rows=all.flatMap(p=>p.rows);
 return {fileName:"drives-"+query.view.toLowerCase()+".csv",
  csv:placementReportCsv(["Drive ID","Company","Role","Status","Job type","Mode",
   "Applications","Pay minimum (INR)","Pay maximum (INR)","Stipend/month (INR)","Dream drive","Created by","Deadline (UTC)"],
   rows.map(r=>[r.id,r.company,r.title,r.status,r.employmentType,r.workMode,r.appliedCount,
    r.minimumAnnualCtcInr,r.maximumAnnualCtcInr,r.stipendPerMonthInr,
    r.isDream?"Yes":"No",r.createdBy,r.applicationDeadline]))};
}
