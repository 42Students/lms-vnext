import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {facultyDiscussionModerationSchema} from "@/modules/courses/faculty-discussion-moderation-model";
import {
  deleteCourseDiscussionMessage,
  toggleCourseDiscussionPin,
} from "@/modules/courses/discussion-service";

export const runtime = "nodejs";
/** Legacy ClassroomController actions: create POST on delivery feed;
 * pin PATCH and delete DELETE on this message route. Version is required
 * for either item mutation; auth and same-origin guards remain mandatory. */
export const COURSE_DISCUSSION_LEGACY_MUTATION_MAP={
 create:"POST /api/courses/deliveries/[deliveryId]/discussions",
 pin:"PATCH /api/courses/deliveries/[deliveryId]/discussions/[messageId]",
 delete:"DELETE /api/courses/deliveries/[deliveryId]/discussions/[messageId]",
} as const;

export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { deliveryId, messageId } = params;
    const version=facultyDiscussionModerationSchema.parse(await boundedRequestJson(request));
    const deleted = await deleteCourseDiscussionMessage(
      context,
      messageId,
      deliveryId,
      version,
    );
    return NextResponse.json({ deleted });
  },
);


export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { deliveryId, messageId } = params;
    const version=facultyDiscussionModerationSchema.parse(await boundedRequestJson(request));
    const message =
      await toggleCourseDiscussionPin(
        context,
        messageId,
        deliveryId,
        version,
      );
    return NextResponse.json({ message });
  },
);
