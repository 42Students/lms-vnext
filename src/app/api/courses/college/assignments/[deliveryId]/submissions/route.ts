import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {parseFacultySubmissionReviewUrl} from "@/modules/courses/faculty-assignment-submissions-model";
import {getCollegeSubmissionReviewPage} from "@/modules/courses/college-assignment-submission-review-service";

export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {deliveryId}=params;
    const query=parseFacultySubmissionReviewUrl(request.url,deliveryId);
    const page=await getCollegeSubmissionReviewPage(context,query);
    return NextResponse.json(page,{headers:{"Cache-Control":"private, no-store"}});
  },
);
