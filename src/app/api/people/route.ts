import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { listCollegePeopleWithRuntime } from "@/modules/people/runtime";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "people.manage" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const searchParams = new URL(request.url).searchParams;
    const page = await listCollegePeopleWithRuntime(context, {
      collegeId: searchParams.get("collegeId"),
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });
    return NextResponse.json(page);
  },
);
