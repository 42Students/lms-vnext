import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { previewCollegeBatchPromotion, CollegePromotionPreviewError } from "@/modules/academics/college-batch-promotion-service";

export const runtime="nodejs";

/** GET /api/academics/batch-promotion/preview?cohortId=UUID&yearStart=YYYY-YY
 * Read-only authorization and model checks are identical to the eventual
 * execute path; the owner must confirm an unchanged preview before POST.
 */
export async function GET(request:Request){
  try{
    const query=new URL(request.url).searchParams;
    if([...query.keys()].some(key=>query.getAll(key).length!==1))
      return NextResponse.json({error:"INVALID_FILTERS"},{status:400});
    const context=await getCurrentRequestContext();
    const result=await previewCollegeBatchPromotion(context,{
      cohortId:query.get("cohortId")??undefined,
      programId:query.get("programId")??undefined,
      yearStart:query.get("yearStart")??undefined,
    });
    return NextResponse.json({status:"OK",preview:result,data:result},
      {headers:{"Cache-Control":"private, no-store"}});
  }catch(error){
    if(error instanceof ZodError)
      return NextResponse.json({error:"INVALID_PROMOTION_QUERY",
        message:"Select a valid batch and academic year."},{status:400});
    if(error instanceof CollegePromotionPreviewError)
      return NextResponse.json({error:error.code,message:"Batch promotion preview unavailable."},
        {status:error.code==="BATCH_NOT_FOUND"?404:409});
    return apiErrorResponse(error);
  }
}
