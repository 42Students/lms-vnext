import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  createCourseSectionDelivery,
  listCourseSectionDeliveries,
} from "@/modules/courses/delivery-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const url = new URL(request.url);
    const deliveries =
      await listCourseSectionDeliveries(
        context,
        url.searchParams.get("offeringId") ?? "",
        url.searchParams.get("includeEnded") ===
          "true",
      );
    return NextResponse.json({ deliveries });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const body = await request.json();
    const delivery =
      await createCourseSectionDelivery(
        context,
        body,
      );
    return NextResponse.json(
      { delivery },
      { status: 201 },
    );
  },
);
