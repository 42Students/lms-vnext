import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getCollegeApplicationRetentionReport} from "@/modules/placements/college-retention-report-service";

export const runtime="nodejs";

/** Legacy 180-day housekeeping preview is loaded only when expanded.
 * The service checks the current actor's college, returns read-only records,
 * and always caps this private sample at 200 applications.
 */
export async function GET(){
 try{
  const context=await getCurrentRequestContext();
  const first=await getCollegeApplicationRetentionReport(context,{
   olderThanDays:180,page:1,pageSize:100,
  });
  const second=first.total>100
   ?await getCollegeApplicationRetentionReport(context,{
      olderThanDays:180,page:2,pageSize:100,
    })
   :null;
  const rows=[...first.rows,...(second?.rows??[])];
  return NextResponse.json({
   rows:rows.map(row=>({
    id:row.id,jobTitle:row.jobTitle,applicationStatus:row.status,
    lastUpdated:row.lastChange.toISOString(),
   })),
   totalStaleCount:first.total,cutoff:first.cutoff.toISOString(),
   truncated:first.total>rows.length,
  },{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
