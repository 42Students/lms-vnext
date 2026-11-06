import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {
 bulkCollegeLessonStudentVisibility,
 updateCollegeLessonStudentVisibility,
} from "@/modules/courses/college-lesson-visibility-service";

export const runtime="nodejs";

export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    return NextResponse.json(await updateCollegeLessonStudentVisibility(context,await request.json()));
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    return NextResponse.json(await bulkCollegeLessonStudentVisibility(context,await request.json()));
  },
);
