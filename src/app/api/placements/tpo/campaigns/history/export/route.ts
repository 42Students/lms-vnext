import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {exportTpoMessagingHistory} from "@/modules/messaging/receipt-history-service";
import {messagingHistoryCsv} from "@/modules/messaging/receipt-history-export-model";
import {z} from "zod";
export const runtime="nodejs";
export async function GET(request:Request){
 const context=await getCurrentRequestContext();
 const raw=new URL(request.url).searchParams;
 // Do not silently accept duplicated filters or unrecognized selectors on
 // a private export. The downloaded scope must match the visible request.
 const keys=[...raw.keys()];
 if(keys.length!==new Set(keys).size||keys.some(key=>key!=="purpose"))
  return NextResponse.json({error:"INVALID_QUERY"},{status:400,headers:{"Cache-Control":"private, no-store"}});
 const parsed=z.object({purpose:z.string().trim().max(160).optional()}).strict().safeParse({
   purpose:raw.get("purpose")||undefined,
 });
 if(!parsed.success)return NextResponse.json({error:"INVALID_QUERY"},{status:400});
 let rows;
 try{rows=await exportTpoMessagingHistory(context,parsed.data);}
 catch(error){
  if(error instanceof Error&&error.message==="CAMPAIGN_EXPORT_TOO_LARGE")
   return NextResponse.json({error:"EXPORT_TOO_LARGE",message:"Narrow the purpose filter before exporting."},{status:413});
  throw error;
 }
 const csv=messagingHistoryCsv(rows.map(row=>({
   id:row.id,purpose:row.purpose,total:row.total,queued:row.queued,sent:row.acceptedByProvider,
   failed:row.failed,suppressed:row.suppressed,createdAt:row.createdAt,finalizedAt:row.finalizedAt,
 })),rows.length);
 return new NextResponse(csv,{headers:{
  "Content-Type":"text/csv; charset=utf-8",
  "Content-Disposition":'attachment; filename="' + gridExportFilename("tpo-campaign-batches", "csv") + '"',
  "Cache-Control":"private, no-store",
  "X-Content-Type-Options":"nosniff",
  "X-Export-Scope":"All filtered batches",
 }});
}
