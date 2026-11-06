import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  createCourseOffering,
  listCourseOfferings,
} from "@/modules/courses/offering-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const url = new URL(request.url);
    const offerings = await listCourseOfferings(
      context,
      url.searchParams.get("cohortId") ?? "",
      url.searchParams.get("academicPeriodId"),
      url.searchParams.get("includeArchived") ===
        "true",
    );
    return NextResponse.json({ offerings });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const body = await request.json();
    const offering = await createCourseOffering(
      context,
      body,
    );
    return NextResponse.json(
      { offering },
      { status: 201 },
    );
  },
);
