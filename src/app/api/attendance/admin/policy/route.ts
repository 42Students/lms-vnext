import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  getCollegeAttendancePolicy,
  updateCollegeAttendancePolicy,
  updateCollegeAttendancePolicyField,
  resetCollegeAttendancePolicyOverride,
} from "@/modules/attendance/policy-service";

export const runtime = "nodejs";

/**
 * Both policy fields are updated together.
 * Origin protection is mandatory because this
 * route changes state using a browser session.
 */
export const PUT = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const body = await request.json();
    const policy =
      await updateCollegeAttendancePolicy(
        context,
        body,
      );
    return NextResponse.json({ policy });
  },
);


/** Authenticated policy read for independent field reload and provenance. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const collegeId=new URL(request.url).searchParams.get("collegeId")??"";
    const {policy,hasCollegeOverride,maxCorrectionHours}=await getCollegeAttendancePolicy(context,collegeId);
    return NextResponse.json({policy,hasCollegeOverride,maxCorrectionHours});
  },
);

/** Compare-and-set only the chosen field; never overwrite a second unsaved draft. */
export const PATCH = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: actor }) => {
    const context = actor!;
    return NextResponse.json(await updateCollegeAttendancePolicyField(context,await request.json()));
  },
);

/** Deleting the policy row restores the effective default for BOTH fields.
 * A per-field Save intentionally keeps an explicit college override.
 */
export const DELETE = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: actor }) => {
    const context = actor!;
    return NextResponse.json(await resetCollegeAttendancePolicyOverride(
      context,await request.json()));
  },
);
