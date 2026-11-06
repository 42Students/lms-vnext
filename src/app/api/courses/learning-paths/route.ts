import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  createLearningPath,
  listLearningPaths,
} from "@/modules/courses/learning-path-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const url = new URL(request.url);
    const learningPaths =
      await listLearningPaths(
        context,
        url.searchParams.get("offeringId") ?? "",
        url.searchParams.get("deliveryId"),
        url.searchParams.get("includeArchived") ===
          "true",
      );
    return NextResponse.json({ learningPaths });
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const body = await request.json();
    const learningPath =
      await createLearningPath(
        context,
        body,
      );
    return NextResponse.json(
      { learningPath },
      { status: 201 },
    );
  },
);
