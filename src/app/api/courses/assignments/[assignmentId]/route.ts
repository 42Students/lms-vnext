import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  updateCourseAssignment,getCourseAssignmentForAdmin,
} from "@/modules/courses/assignment-service";
import { updateCourseAssignmentInputSchema } from "@/modules/courses/assignment-validation";

export const runtime = "nodejs";

// Admin/faculty edits are read-modify-write: the version the editor loaded
// must accompany every PATCH so a stale form cannot overwrite newer changes.
const versionedPatchSchema = z.looseObject({
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
});

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const {assignmentId}=params;
    const assignment=await getCourseAssignmentForAdmin(context,assignmentId);
    return NextResponse.json({assignment},{headers:{"Cache-Control":"private, no-store"}});
  },
);

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { assignmentId } = params;
    const body: unknown = await boundedRequestJson(request);
    if (!versionedPatchSchema.safeParse(body).success) {
      return NextResponse.json(
        { error: "FACULTY_ASSIGNMENT_STALE_VERSION" },
        { status: 409 },
      );
    }
    const assignment =
      await updateCourseAssignment(
        context,
        assignmentId,
        updateCourseAssignmentInputSchema.parse(body),
      );
    return NextResponse.json({ assignment });
  },
);
