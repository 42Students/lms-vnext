import { NextResponse } from "next/server";
import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getDb } from "@/db/client";
import {
  colleges, organizations, departments, programs, cohorts, sections,
  programTerms, lectureHalls, courseQuizzes, courseLessons,
  courseLearningPaths, courseOfferings, courses,
} from "@/db/schema";
import { apiErrorResponse } from "@/lib/api-error";
import { db10Announcements } from "@/db/schema/db10-announcements";
import { isSuperAdmin } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { resolveActingCollege } from "@/modules/permissions/acting-college";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Legacy AdminRecycleBinController /types registry, excluding Batch.
 * A deleted item is NOT merely an inactive row. The vNext models encode
 * deletion as archivedAt, ARCHIVED, or imported legacyWasDeleted separately.
 */
const types = [
  { type: "DEPARTMENT", label: "Department", platformLevel: false },
  { type: "PROGRAM", label: "Program", platformLevel: false },
  { type: "CLASS", label: "Class", platformLevel: false },
  { type: "SEMESTER", label: "Semester", platformLevel: false },
  { type: "LECTURE_HALL", label: "Lecture Hall", platformLevel: false },
  { type: "QUIZ", label: "Quiz", platformLevel: false },
  { type: "NOTIFICATION", label: "Notification", platformLevel: false },
  { type: "COLLEGE", label: "College", platformLevel: true },
  { type: "ORGANIZATION", label: "Organization", platformLevel: true },
] as const;
const typeSchema = z.enum([
  "DEPARTMENT","PROGRAM","CLASS","SEMESTER","LECTURE_HALL",
  "QUIZ","NOTIFICATION","COLLEGE","ORGANIZATION",
]);
type RecycleType = z.infer<typeof typeSchema>;
type DeletedRow = { id: string; name: string; subtitle: string };
const limit = 200;
const headers = { "Cache-Control": "private, no-store" };

function typedError(message: string, status: number) {
  return NextResponse.json({error:"INVALID_RECYCLE_BIN_FILTER",message},{status,headers});
}

/** GET ?entityType=DEPARTMENT [&collegeId=<selected-college-uuid>]
 * Platform rows require an active Super Admin. Tenant rows always resolve the
 * current membership or Super Admin acting-college; caller-provided collegeId
 * is a scope assertion only, never a way to choose a different tenant.
 * Return a capped deleted-only list without materializing full datasets.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const typeInput = url.searchParams.get("entityType");
  try {
    const context = await getCurrentRequestContext();
    if (url.searchParams.get("types") === "1") {
      const visible = isSuperAdmin(context) ?
        (requirePermission(context,"admin-scope.select"),types) :
        (await resolveActingCollege(context,"academics.manage"),
          types.filter(item=>!item.platformLevel));
      return NextResponse.json({status:"OK",types:visible},{headers});
    }
    const parsed = typeSchema.safeParse(typeInput);
    if (!parsed.success) return typedError("Choose a valid deleted item type.",400);
    const entityType: RecycleType = parsed.data;
    const meta = types.find(item => item.type === entityType)!;
    const requestedCollege = url.searchParams.get("collegeId");
    const db = getDb();
    let rows: DeletedRow[] = [];
    let warning: string | null = null;

    if (meta.platformLevel) {
      if (!isSuperAdmin(context)) {
        requirePermission(context,"admin-scope.select");
      }
      requirePermission(context,"admin-scope.select");
      if (entityType === "ORGANIZATION") {
        rows = await db.select({
          id:organizations.id,name:organizations.name,
          subtitle:organizations.status,
        }).from(organizations).where(eq(organizations.status,"ARCHIVED"))
          .orderBy(asc(organizations.name),asc(organizations.id)).limit(limit);
      } else {
        rows = await db.select({
          id:colleges.id,name:colleges.name,subtitle:colleges.code,
        }).from(colleges).where(eq(colleges.status,"ARCHIVED"))
          .orderBy(asc(colleges.name),asc(colleges.id)).limit(limit);
      }
    } else {
      const acting = await resolveActingCollege(context,"academics.manage");
      if (requestedCollege !== null) {
        const requested = z.string().uuid().safeParse(requestedCollege);
        if (!requested.success || requested.data !== acting.collegeId) {
          return typedError("The requested college does not match the selected workspace.",403);
        }
      }
      switch (entityType) {
        case "DEPARTMENT":
          rows = await db.select({
            id:departments.id,name:departments.name,
            subtitle:departments.name,
          }).from(departments)
            .where(and(eq(departments.collegeId,acting.collegeId),
              isNotNull(departments.archivedAt)))
            .orderBy(asc(departments.name),asc(departments.id)).limit(limit);
          break;
        case "PROGRAM":
          rows = await db.select({
            id:programs.id,name:programs.name,subtitle:programs.code,
          }).from(programs)
            .innerJoin(departments,eq(departments.id,programs.departmentId))
            .where(and(eq(departments.collegeId,acting.collegeId),
              eq(programs.status,"ARCHIVED")))
            .orderBy(asc(programs.name),asc(programs.id)).limit(limit);
          break;
        case "CLASS":
          rows = await db.select({
            id:sections.id,name:sections.name,subtitle:sections.code,
          }).from(sections)
            .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
            .innerJoin(programs,eq(programs.id,cohorts.programId))
            .innerJoin(departments,eq(departments.id,programs.departmentId))
            .where(and(eq(departments.collegeId,acting.collegeId),
              eq(sections.status,"ARCHIVED")))
            .orderBy(asc(sections.name),asc(sections.id)).limit(limit);
          break;
        case "SEMESTER":
          rows = await db.select({
            id:programTerms.id,name:programTerms.name,
            subtitle:programTerms.name,
          }).from(programTerms)
            .innerJoin(programs,eq(programs.id,programTerms.programId))
            .innerJoin(departments,eq(departments.id,programs.departmentId))
            .where(and(eq(departments.collegeId,acting.collegeId),
              eq(programTerms.legacyWasDeleted,true)))
            .orderBy(asc(programTerms.name),asc(programTerms.id)).limit(limit);
          break;
        case "LECTURE_HALL":
          rows = await db.select({
            id:lectureHalls.id,name:lectureHalls.name,
            subtitle:lectureHalls.roomType,
          }).from(lectureHalls)
            .where(and(eq(lectureHalls.collegeId,acting.collegeId),
              eq(lectureHalls.status,"ARCHIVED")))
            .orderBy(asc(lectureHalls.name),asc(lectureHalls.id)).limit(limit);
          break;
        case "QUIZ":
          rows = await db.select({
            id:courseQuizzes.id,name:courseQuizzes.title,
            subtitle:courses.code,
          }).from(courseQuizzes)
            .innerJoin(courseLessons,eq(courseLessons.id,courseQuizzes.lessonId))
            .innerJoin(courseLearningPaths,
              eq(courseLearningPaths.id,courseLessons.learningPathId))
            .innerJoin(courseOfferings,
              eq(courseOfferings.id,courseLearningPaths.offeringId))
            .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
            .innerJoin(departments,eq(departments.id,courses.departmentId))
            .where(and(eq(departments.collegeId,acting.collegeId),
              eq(courseQuizzes.status,"ARCHIVED")))
            .orderBy(asc(courseQuizzes.title),asc(courseQuizzes.id)).limit(limit);
          break;
        case "NOTIFICATION": {
          // Read the authored announcement tombstone only. A recipient's
          // dismissed in-app notification is not an authored campaign and
          // must never be exposed through this administrative recycle bin.
          const ready = await db.execute(sql<{present:boolean}>`
            select to_regclass('public.announcements') is not null as present
          `);
          if (ready.rows[0]?.["present"] !== true) {
            warning = "Deleted announcements are unavailable until announcement storage is ready.";
            break;
          }
          rows = await db.select({
            id:db10Announcements.id,name:db10Announcements.title,
            subtitle:db10Announcements.receiverType,
          }).from(db10Announcements)
            .where(and(eq(db10Announcements.collegeId,acting.collegeId),
              isNotNull(db10Announcements.deletedAt)))
            .orderBy(asc(db10Announcements.title),asc(db10Announcements.id))
            .limit(limit);
          break;
        }
      }
    }
    return NextResponse.json({
      status:"OK",entityType,platformLevel:meta.platformLevel,
      items:rows,count:rows.length,hasMore:rows.length===limit,warning,
      message:rows.length ? "Deleted items loaded." : warning ?? "No deleted items found.",
    },{headers});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
