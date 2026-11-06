import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  CollegeSectionError, updateCollegeSection,
} from "@/modules/academics/college-section-mutation-service";

import { deleteCollegeSection, CollegeSectionLifecycleError } from "@/modules/academics/college-section-lifecycle-service";

export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { sectionId } = params;
    const body: unknown = await request.json();
    const section = await updateCollegeSection(context, sectionId, body);
    return NextResponse.json({ section });
  },
);

/** Dependency-free hard delete only. Historical children always block it. */
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {sectionId}=params;
    const deleted=await deleteCollegeSection(context,sectionId,await request.json());
    return NextResponse.json({deleted},{headers:{"Cache-Control":"private, no-store"}});
  },
);
