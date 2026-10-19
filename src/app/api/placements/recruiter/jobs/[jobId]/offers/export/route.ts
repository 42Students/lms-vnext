import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {hrApplicantFilterSchema} from "@/modules/placements/hr-job-applicants-model";
import {getHrJobRead} from "@/modules/placements/hr-job-read-service";
import {buildHrOfferCsv,HR_OFFER_EXPORT_CAP} from "@/modules/placements/hr-offer-export-model";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{jobId:string}>}){
 try{
  const {jobId}=await params;
  const url=new URL(request.url);
  const allowed=["offerState"];
  if([...url.searchParams.keys()].some(key=>!allowed.includes(key))||
     allowed.some(key=>url.searchParams.getAll(key).length>1))
   return Response.json({error:"INVALID_QUERY"},{status:400});
  const query=hrApplicantFilterSchema.parse({
   tab:"offers",offerState:url.searchParams.get("offerState")??undefined,offerPage:1,
  });
  // Pre-issue selection ledger states are not issued offers. Exporting them
  // through the offer reader would produce a falsely empty CSV with unrelated
  // offer counts. Do not query applicant information for these filters.
  if(["SELECTED","PENDING_VERIFICATION","REVOKED"].includes(query.offerState))
   return Response.json({error:"OFFER_STATE_NOT_EXPORTABLE"},{status:400});
  const context=await getCurrentRequestContext();
  const first=await getHrJobRead(context,jobId,query);
  const total=first.offersPage.total;
  const rows=[...first.offers];
  const pages=Math.min(first.offersPage.pages,
   Math.ceil(HR_OFFER_EXPORT_CAP/first.offersPage.pageSize));
  for(let page=2;page<=pages;page++){
   const next=await getHrJobRead(context,jobId,{...query,offerPage:page});
   rows.push(...next.offers);
  }
  const exportResult=buildHrOfferCsv(rows,total);
  return new Response(exportResult.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="' + gridExportFilename("recruiter-offers", "csv") + '"',
   "Cache-Control":"private, no-store","X-Export-Omitted":String(exportResult.omitted),
  }});
 }catch(error){return apiErrorResponse(error);}
}
