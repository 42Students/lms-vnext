import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  loadCollegeOwnProfile, updateCollegeOwnProfile,
  CollegeProfileVersionConflict, CollegeProfileVersionRequired,
} from "@/modules/people/college-admin-profile-edit-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor }) => {
    const context = actor!;
    const profile = await loadCollegeOwnProfile(context);
    return NextResponse.json({ profile }, { headers: { "Cache-Control": "private, no-store" } });
  },
);
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const profile = await updateCollegeOwnProfile(context, await request.json());
    return NextResponse.json({ profile },{headers:{"Cache-Control":"private, no-store"}});
  },
);
