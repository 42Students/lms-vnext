import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  CollegeSectionError, createCollegeSection,
} from "@/modules/academics/college-section-mutation-service";

export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const body: unknown = await request.json();
    const section = await createCollegeSection(context, body);
    return NextResponse.json({ section }, { status: 201 });
  },
);
