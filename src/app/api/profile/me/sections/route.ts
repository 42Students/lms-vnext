import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { updateOwnLearnerProfileSection } from "@/modules/people/learner-profile-section-service";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    return NextResponse.json(await updateOwnLearnerProfileSection(context,await boundedRequestJson(request)));
  },
);
