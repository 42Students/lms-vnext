import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {listTpoMessagingHistory} from "@/modules/messaging/receipt-history-service";
import {messagingHistoryCsv} from "@/modules/messaging/receipt-history-export-model";
import {z} from "zod";
export const runtime="nodejs";
export async function GET(request:Request){
 const context=await getCurrentRequestContext();
 const raw=new URL(request.url).searchParams;
 const parsed=z.object({page:z.coerce.number().int().min(1).max(10000).default(1)}).strict()
   .safeParse({page:raw.get("page")??undefined});
 if(!parsed.success)return NextResponse.json({error:"INVALID_QUERY"},{status:400});
 const data=await listTpoMessagingHistory(context,parsed.data);
 const csv=messagingHistoryCsv(data.rows.map(row=>({
   id:row.id,purpose:row.purpose,total:row.total,queued:row.queued,sent:row.acceptedByProvider,
   failed:row.failed,suppressed:row.suppressed,createdAt:row.createdAt,finalizedAt:row.finalizedAt,
 })),data.total);
 return new NextResponse(csv,{headers:{
  "Content-Type":"text/csv; charset=utf-8",
  "Content-Disposition":'attachment; filename="tpo-campaign-batches.csv"',
  "Cache-Control":"private, no-store",
  "X-Export-Page":String(data.page),
 }});
}
