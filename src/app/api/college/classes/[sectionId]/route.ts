import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  CollegeSectionError, updateCollegeSection,
} from "@/modules/academics/college-section-mutation-service";

import { deleteCollegeSection, CollegeSectionLifecycleError } from "@/modules/academics/college-section-lifecycle-service";

import { CACHE, privateJson } from "@/security/responses";
export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const { sectionId } = params;
const body: unknown = await boundedRequestJson(request);
const section = await updateCollegeSection(context, sectionId, body);
return NextResponse.json({ section });
} catch (error) {
    if (error instanceof CollegeSectionError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code === "CLASS_NOT_FOUND" ||
          error.code === "CLASS_COHORT_NOT_FOUND" ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
  },
);

/** Dependency-free hard delete only. Historical children always block it. */
export const DELETE = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: __actor, params }) => {
    const context = __actor!;
    try {
const {sectionId}=params;
const deleted=await deleteCollegeSection(context,sectionId,await boundedRequestJson(request));
return privateJson({deleted});
} catch(error){
  if(error instanceof CollegeSectionLifecycleError || error instanceof CollegeSectionError)
   return NextResponse.json({error:error.code},{
    status:error.code==="CLASS_NOT_FOUND"?404:409,
    headers:{"Cache-Control":CACHE.PRIVATE},
   });
  return apiErrorResponse(error);
 }
  },
);
