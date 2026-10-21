import { NextResponse } from "next/server";
import { collegeSemesterDirectorySchema } from "@/modules/academics/college-academic-directory-model";
import { listCollegeSemesters } from "@/modules/academics/college-academic-directory-service";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { createCollegeSemester, SemesterMutationError } from "@/modules/academics/semester-mutation-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  // A duplicate key must never broaden the read scope silently.
  if ([...query.keys()].some(key => query.getAll(key).length > 1)) {
    return NextResponse.json({ error: "INVALID_FILTERS" }, { status: 400 });
  }
  const parsed = collegeSemesterDirectorySchema.safeParse(Object.fromEntries(query));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_FILTERS", issues: parsed.error.issues }, { status: 400 });
  try {
    const context = await getCurrentRequestContext();
    const directory = await listCollegeSemesters(context, parsed.data);
    return NextResponse.json({ status: "OK", message: "OK", data: directory.items,
      semesters: directory.items, total: directory.total, page: directory.query.page,
      totalPages: directory.totalPages, programs: directory.programs });
  } catch (error) { return apiErrorResponse(error); }
}


export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const body: unknown = await request.json();
    const semester = await createCollegeSemester(context, body);
    return NextResponse.json({ status: "OK", message: "Semester created successfully", data: semester, semester }, { status: 201 });
  } catch (error) {
    if (error instanceof SemesterMutationError) {
      return NextResponse.json({ error: error.code,
        message: error.code === "SEMESTER_NUMBER_CONFLICT"
          ? "A semester with this number already exists for this program"
          : error.code === "PROGRAM_NOT_FOUND" ? "Program not found" : error.message,
      }, {
        status: error.code === "PROGRAM_NOT_FOUND" ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
}
