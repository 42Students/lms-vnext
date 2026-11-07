import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { updateOwnLearnerContacts } from "@/modules/people/learner-contact-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "profile.self.manage" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const result = await updateOwnLearnerContacts(context, await boundedRequestJson(request));
    return NextResponse.json(result);
  },
);
