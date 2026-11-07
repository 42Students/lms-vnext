import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getLearnerAssessmentOverview} from "@/modules/courses/learner-assessment-service";
import {learnerDueSoonNotices} from "@/modules/courses/learner-assignment-due-notice-model";
import {apiErrorResponse} from "@/lib/api-error";
export const runtime="nodejs";
/** Learner-only live reminder read; no externally scheduled delivery is claimed. */
export const GET = route(
  { auth: "user", permission: "courses.read" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    const overview=await getLearnerAssessmentOverview(__ctx);
    const notices=learnerDueSoonNotices(overview.assignments,new Date(overview.snapshotNowMs));
    return NextResponse.json({notices},{headers:{"Cache-Control":"no-store"}});
  },
);
