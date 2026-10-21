import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  getOwnLearnerProfileWithRuntime,
} from "@/modules/people/runtime";

import {updateOwnLearnerProfileDocument} from "@/modules/people/learner-profile-document-edit-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context =
      await getCurrentRequestContext();
    // Existing legacy section links resolve to the learner's OWN profile.
    // Never re-interpret a legacy numeric student ID as an authorization grant.
    const legacySection = new URL(request.url).searchParams.get("legacySection");
    if (legacySection !== null) {
      if (!hasMembershipRole(context, "LEARNER")) {
        return NextResponse.json({error:"FORBIDDEN"},{status:403});
      }
      const validSections = new Set(["about","education","skills","projects","certifications","experiences","jobPreferences"]);
      if (!validSections.has(legacySection)) {
        return NextResponse.json({error:"INVALID_SECTION"},{status:400});
      }
      return NextResponse.redirect(new URL("/learn/profile?section="+encodeURIComponent(legacySection), request.url), 307);
    }
    const result =
      await getOwnLearnerProfileWithRuntime(
        context,
      );

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const profile =
      await updateOwnLearnerProfileDocument(
        context,
        await request.json(),
      );

    return NextResponse.json({ profile });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/** Stable route replacement directory for legacy LearnerProfileController consumers. */
export const LEARNER_PROFILE_ROUTE_REPLACEMENTS = {
  header: "PUT /api/profile/me",
  about: "PUT /api/profile/me",
  personalDetails: "PUT /api/profile/me",
  identity: "PUT /api/profile/me",
  contact: "PUT /api/profile/me",
  address: "PUT /api/profile/me",
  socialProfiles: "PUT /api/profile/me",
  languages: "PATCH /api/profile/me/sections",
  education: "PATCH /api/profile/me/sections",
  certifications: "PATCH /api/profile/me/sections",
  experiences: "PATCH /api/profile/me/sections",
  skills: "PATCH /api/profile/me/sections",
  projects: "PATCH /api/profile/me/sections",
  publications: "PATCH /api/profile/me/sections",
  awards: "PATCH /api/profile/me/sections",
  metadata: "PUT /api/profile/me",
  resume: "PUT /api/profile/me",
  jobPreferences: "PUT /api/profile/me",
  qualifications: "PATCH /api/profile/me/sections",
  achievements: "PATCH /api/profile/me/sections",
} as const;

/** Read-only discovery. Existing GET/PUT and section PATCH contracts are unchanged. */
export async function OPTIONS() {
  return NextResponse.json({
    version: 1, read: "GET /api/profile/me",
    sections: LEARNER_PROFILE_ROUTE_REPLACEMENTS,
    legacySectionRedirect: "GET /api/profile/me?legacySection={section}",
    administrativeProfile: "GET /api/college/students/{membershipId}/profile (requires authorized college context)",
  }, { headers: { Allow: "GET, PUT, OPTIONS", "Cache-Control": "no-store" } });
}
