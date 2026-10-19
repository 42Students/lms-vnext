import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {hrDriveProposalHistoryQuerySchema} from "@/modules/placements/hr-drive-proposal-history-model";
import {listHrDriveProposals} from "@/modules/placements/hr-drive-proposal-history-service";
import {hrDriveProposalHistoryCsv} from "@/modules/placements/hr-drive-proposal-export-model";
export const runtime="nodejs";
/** Read-only, college-scoped CSV for the requested 20-row proposal-history page. */
export async function GET(request:Request){
 try{
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context)||context.recruiter?.userId!==context.user.id)
  return NextResponse.json({error:"FORBIDDEN"},{status:403});
 const search=new URL(request.url).searchParams;
 const allowed=["collegeId","page","q","sort"];
 if([...search.keys()].some(key=>!allowed.includes(key)) ||
    allowed.some(key=>search.getAll(key).length>1))
  return NextResponse.json({error:"INVALID_QUERY"},{status:400});
 const parsed=hrDriveProposalHistoryQuerySchema.safeParse({
  collegeId:search.get("collegeId")??undefined,
  page:search.get("page")??undefined,
  q:search.get("q")??undefined,
  sort:search.get("sort")??undefined,
 });
 if(!parsed.success)return NextResponse.json({error:"INVALID_QUERY"},{status:400});
 const result=await listHrDriveProposals(context,parsed.data);
 if(result.status!=="READY")
  return NextResponse.json({error:result.status==="CHOOSE_COLLEGE"?"COLLEGE_REQUIRED":"FORBIDDEN"},
   {status:result.status==="CHOOSE_COLLEGE"?400:403});
 const csv=hrDriveProposalHistoryCsv(result.items);
 return new NextResponse(csv,{headers:{
  "Content-Type":"text/csv; charset=utf-8",
  "Content-Disposition":'attachment; filename="' + gridExportFilename("recruiter-discussion-proposals", "csv") + '"',
  "Cache-Control":"private, no-store",
  "X-Export-Scope":"CURRENT_PAGE",
  "X-Export-Page":String(result.page),
 }});
 }catch(error){return apiErrorResponse(error);}
}
