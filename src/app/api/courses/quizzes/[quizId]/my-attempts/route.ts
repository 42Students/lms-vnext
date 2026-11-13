import { route } from "@/security/route";
import {
  getMyQuizAttempts,resolveOwnQuizDeliveryId,
} from "@/modules/courses/quiz-attempt-service";

import { privateJson } from "@/security/responses";
export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { quizId } = params;
    const url = new URL(request.url);
    const explicit=url.searchParams.get("deliveryId");
    const deliveryId=explicit||await resolveOwnQuizDeliveryId(context,quizId);
    const attempts = await getMyQuizAttempts(context,quizId,deliveryId);
    return privateJson({ attempts,deliveryId });
  },
);
