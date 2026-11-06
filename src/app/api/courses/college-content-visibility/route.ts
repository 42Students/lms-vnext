import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { updateCollegeContentStudentVisibility } from "@/modules/courses/college-content-visibility-service";
export const runtime="nodejs";
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    return NextResponse.json(await updateCollegeContentStudentVisibility(context,await request.json()));
  },
);
