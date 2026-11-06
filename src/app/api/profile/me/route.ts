import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import { hasAmbiguousQuerySelectors } from "@/lib/security-query-selectors";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  getOwnLearnerProfileWithRuntime,
} from "@/modules/people/runtime";

import {updateOwnLearnerProfileDocument} from "@/modules/people/learner-profile-document-edit-service";
import { secured } from "@/security/secure-handler";

export const runtime = "nodejs";
const MAX_PROFILE_DOCUMENT_BYTES = 2 * 1024 * 1024;
const privateHeaders = { "Cache-Control": "private, no-store" };

async function handleGET(request: Request) {
  try {
    const context =
      await getCurrentRequestContext();
    // Existing legacy section links resolve to the learner's OWN profile.
    // Never re-interpret a legacy numeric student ID as an authorization grant.
    const query = new URL(request.url).searchParams;
    if (hasAmbiguousQuerySelectors(query, ["legacySection"], [], ["legacySection"]))
      return NextResponse.json({error:"INVALID_SECTION"},
        {status:400,headers:privateHeaders});
    const legacySection = query.get("legacySection");
    if (legacySection !== null) {
      if (!hasMembershipRole(context, "LEARNER")) {
        return NextResponse.json({error:"FORBIDDEN"},{status:403,headers:privateHeaders});
      }
      const validSections = new Set(["about","education","skills","projects","certifications","experiences","jobPreferences"]);
      if (!validSections.has(legacySection)) {
        return NextResponse.json({error:"INVALID_SECTION"},{status:400,headers:privateHeaders});
      }
      const redirect=NextResponse.redirect(
        new URL("/learn/profile?section="+encodeURIComponent(legacySection),request.url),307);
      redirect.headers.set("Cache-Control","private, no-store");
      redirect.headers.set("Referrer-Policy","no-referrer");
      return redirect;
    }
    const result =
      await getOwnLearnerProfileWithRuntime(
        context,
      );

    return NextResponse.json(result,{headers:privateHeaders});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = secured(handleGET);

async function handlePUT(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    // A full-document edit may include education and experience history,
    // but must never buffer an arbitrary-size JSON payload.
    const body=await readBoundedJsonBody(request,MAX_PROFILE_DOCUMENT_BYTES);
    if(body.kind!=="OK")
      return NextResponse.json({error:"INVALID_PROFILE"},
        {status:body.kind==="TOO_LARGE"?413:400,headers:privateHeaders});
    const profile=await updateOwnLearnerProfileDocument(context,body.value);
    return NextResponse.json({profile},{headers:privateHeaders});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const PUT = secured(handlePUT);

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
async function handleOPTIONS() {
  return NextResponse.json({
    version: 1, read: "GET /api/profile/me",
    sections: LEARNER_PROFILE_ROUTE_REPLACEMENTS,
    legacySectionRedirect: "GET /api/profile/me?legacySection={section}",
    administrativeProfile: "GET /api/college/students/{membershipId}/profile (requires authorized college context)",
  }, { headers: { Allow: "GET, PUT, OPTIONS", "Cache-Control": "no-store" } });
}
export const OPTIONS = secured(handleOPTIONS);
