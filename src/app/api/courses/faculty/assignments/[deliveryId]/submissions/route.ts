import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { parseFacultySubmissionReviewUrl } from "@/modules/courses/faculty-assignment-submissions-model";
import { getFacultySubmissionReviewPage } from "@/modules/courses/faculty-submission-review-service";
export const runtime = "nodejs";
export async function GET(request: Request, {params}: {params:Promise<{deliveryId:string}>}) {
  try {
    const context = await getCurrentRequestContext();
    const {deliveryId} = await params;
    const query = parseFacultySubmissionReviewUrl(request.url,deliveryId);
    const data = await getFacultySubmissionReviewPage(context,query);
    return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) { return apiErrorResponse(error); }
}
