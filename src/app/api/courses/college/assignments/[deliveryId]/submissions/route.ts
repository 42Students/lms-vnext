import { route } from "@/security/route";

import {parseFacultySubmissionReviewUrl} from "@/modules/courses/faculty-assignment-submissions-model";
import {getCollegeSubmissionReviewPage} from "@/modules/courses/college-assignment-submission-review-service";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {deliveryId}=params;
    const query=parseFacultySubmissionReviewUrl(request.url,deliveryId);
    const page=await getCollegeSubmissionReviewPage(context,query);
    return privateJson(page);
  },
);
