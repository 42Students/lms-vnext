import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  endCourseSectionDelivery,
} from "@/modules/courses/delivery-service";

export const runtime = "nodejs";

export const DELETE = route(
  { auth: "user", permission: "courses.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { deliveryId } = params;
    const delivery =
      await endCourseSectionDelivery(
        context,
        deliveryId,
      );
    return NextResponse.json({ delivery });
  },
);
