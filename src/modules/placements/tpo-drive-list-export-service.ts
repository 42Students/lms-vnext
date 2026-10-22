import { legacyGridExportFilename } from "@/modules/placements/grid-export-filename";
import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoDriveLifecycleList} from "./tpo-drive-lifecycle-list-service";
import {tpoDriveLifecycleQuerySchema,tpoDriveWhereItIs} from "./tpo-drive-lifecycle-list-model";
import {placementReportCsv} from "./report-model";

const MAX_PAGES=1000; // 25,000 matching drives, far beyond the page preview.
export async function exportTpoDriveLifecycle(context:RequestContext,raw:unknown){
 const input=raw&&typeof raw==="object"&&!Array.isArray(raw)?
  raw as Record<string,unknown>:{};
 const scope=input["scope"]==="PAGE"?"PAGE":input["scope"]==="SELECTED"?"SELECTED":"ALL";
 const rawIds=Array.isArray(input["ids"])?input["ids"]:typeof input["ids"]==="string"?[input["ids"]]:[];
 const selectedIds=rawIds.filter((x):x is string=>typeof x==="string");
 if(scope==="SELECTED"&&(!selectedIds.length||selectedIds.length>25||
  new Set(selectedIds).size!==selectedIds.length||
  selectedIds.some(id=>!/^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(id))))
  throw Error("Select between 1 and 25 distinct current-page drives or requests to export.");
 const {scope:_scope,ids:_ids,...rest}=input;
 const query=tpoDriveLifecycleQuerySchema.parse(rest);
 const first=await getTpoDriveLifecycleList(context,scope==="ALL"?{...query,page:1}:query);
 const all=scope==="PAGE"||scope==="SELECTED"?[first]:[];
 if(scope==="ALL"){
  if(first.totalPages>MAX_PAGES)throw Error("This export exceeds 25,000 drives. Narrow the filters before exporting.");
  all.push(first);
  for(let page=2;page<=first.totalPages;page++){
   all.push(await getTpoDriveLifecycleList(context,{...query,page}));
  }
 }
 if(query.view==="REQUESTS"){
  const rows=all.flatMap(p=>p.requestRows).filter(r=>scope!=="SELECTED"||selectedIds.includes(r.id));
  if(scope==="SELECTED"&&rows.length!==selectedIds.length)throw Error("Selection is stale or outside your permitted filter. Refresh the list.");
  return {fileName:legacyGridExportFilename("drives-requests","csv"),csv:placementReportCsv([
   "Request ID","Company","Role","Status","Requested at (UTC)","Approved draft ID",
  ],rows.map(r=>[r.id,r.company,r.title,r.status,r.createdAt,r.approvedJobId]))};
 }
 const rows=all.flatMap(p=>p.rows).filter(r=>scope!=="SELECTED"||selectedIds.includes(r.id));
 if(scope==="SELECTED"&&rows.length!==selectedIds.length)throw Error("Selection is stale or outside your permitted filter. Refresh the list.");
 return {fileName:legacyGridExportFilename("drives-"+query.view.toLowerCase(),"csv"),
  csv:placementReportCsv(["Drive ID","Company","Role","Status","Job type","Mode",
   "Applications","Active offers","Rounds completed","Rounds total","Where it is","Pay minimum (INR)","Pay maximum (INR)","Stipend/month (INR)","Dream drive","Created by","Deadline (UTC)"],
   rows.map(r=>[r.id,r.company,r.title,r.status,r.employmentType,r.workMode,r.appliedCount,
    r.offersMade,r.roundsCompleted,r.roundCount,tpoDriveWhereItIs({
     status:r.status,applicationDeadline:r.applicationDeadline,
     roundCount:r.roundCount,roundsCompleted:r.roundsCompleted,
     nextRoundAt:r.nextRoundAt,offersMade:r.offersMade,
    },first.asOf),
    r.minimumAnnualCtcInr,r.maximumAnnualCtcInr,r.stipendPerMonthInr,
    r.isDream?"Yes":"No",r.createdBy,r.applicationDeadline]))};
}
