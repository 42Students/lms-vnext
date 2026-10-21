import { and, eq, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getDb } from "@/db/client";
import { courses, departments } from "@/db/schema";
import { apiErrorResponse } from "@/lib/api-error";
import { loadAcademicCollegeScope } from "@/modules/academics/scope";
import { CoursesServiceError } from "@/modules/courses/errors";
import { loadCourseScope } from "@/modules/courses/scope";
import { requirePermission } from "@/modules/permissions/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };
const uuid = z.string().uuid();
const slugSchema = z.string().min(1).max(64)
  .regex(/^[a-z0-9][a-z0-9._-]*$/);

/** Authenticated, tenant-scoped legacy /by-slug/{slug} compatibility.
 * An archived slug remains reserved in the unique index, but is not exposed
 * to a catalog reader. Numeric legacy IDs are never guessed from slugs.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const context = await getCurrentRequestContext();
    const { slug: rawSlug } = await params;
    const url = new URL(request.url);
    const slug = slugSchema.safeParse(rawSlug.toLowerCase());
    const collegeParams = url.searchParams.getAll("collegeId");
    const courseParams = url.searchParams.getAll("courseId");
    if (!slug.success || collegeParams.length !== 1 || courseParams.length > 1) {
      return NextResponse.json({ error: "INVALID_REQUEST" }, {
        status: 400, headers: { "Cache-Control": "private, no-store" },
      });
    }
    // A selected/authorized college is required even for a globally unique
    // slug: the slug must never become a cross-college existence oracle.
    const collegeId = uuid.parse(collegeParams[0]);
    const college = await loadAcademicCollegeScope(collegeId);
    requirePermission(context, "courses.read", {
      collegeId: college.id, organizationId: college.organizationId,
    });
    const [match] = await getDb()
      .select({ id: courses.id })
      .from(courses)
      .innerJoin(departments, eq(departments.id, courses.departmentId))
      .where(and(
        eq(departments.collegeId, college.id),
        isNull(departments.archivedAt),
        eq(courses.status, "ACTIVE"),
        sql`lower(${courses.slug}) = ${slug.data}`,
      ))
      .limit(1);
    if (!match) throw new CoursesServiceError("COURSE_NOT_FOUND");
    if (courseParams.length === 1 && courseParams[0] !== match.id) {
      // Matching both selectors is mandatory, so a mismatched course UUID
      // cannot silently change the selected course.
      throw new CoursesServiceError("COURSE_NOT_FOUND");
    }
    const course = await loadCourseScope(match.id);
    return NextResponse.json({ course }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
