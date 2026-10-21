import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { listPrograms } from "@/modules/academics/program-service";
import {parseLegacyProgramPage,legacyProgramPage} from "@/modules/admin-ui/legacy-program-page-model";
import {
  CollegeProgramMutationError,
  createCollegeProgram,
} from "@/modules/academics/college-program-mutation-service";

export const runtime = "nodejs";

/** Client-safe field hints for this vNext creation contract only. Do not
 * expose internal DB constraint text or foreign-college department identities.
 * Legacy numeric program IDs and selection/usage POSTs belong to separate
 * versioned adapters, never the program-create POST.
 */
function programCreateFieldErrors(error: ZodError) {
  const fields: Record<string, string> = {};
  const messages: Record<string, string> = {
    departmentId: "Please select a department",
    name: "Please enter program name",
    code: "Enter a valid program code",
    durationTerms: "Duration must be a whole number from 1 to 24 terms",
  };
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || !(field in messages) || fields[field]) continue;
    fields[field] = field === "name" && issue.code === "too_big"
      ? "Maximum 255 characters"
      : messages[field]!;
  }
  return fields;
}

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const programs = await listPrograms(
      context,
      url.searchParams.get("collegeId") ?? "",
      url.searchParams.get("departmentId"),
    );
    // Explicit zero-based pagination preserves the historical page contract
    // without exposing numeric-ID aliases or cross-college unscoped reads.
    // Calls without pagination still receive the existing vNext {programs}.
    const page=parseLegacyProgramPage(url.searchParams);
    if(page===false)return NextResponse.json({error:"INVALID_PAGINATION",message:"Page must be a non-negative integer and size must be between 1 and 100."},{status:400});
    if(page)return NextResponse.json({programs:legacyProgramPage(programs,page)});
    return NextResponse.json({ programs });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const body: unknown = await request.json();
    const program = await createCollegeProgram(context, body);
    return NextResponse.json({ program }, { status: 201 });
  } catch (error) {
    if (error instanceof CollegeProgramMutationError) {
      const fieldErrors = error.code === "PROGRAM_NAME_CONFLICT"
        ? { name: "Program name already exists in this department" }
        : error.code === "PROGRAM_CODE_CONFLICT"
          ? { code: "Program code already exists in this department" }
          : {};
      return NextResponse.json({
        error: error.code,
        fieldErrors,
        message: error.code === "PROGRAM_NAME_CONFLICT"
          ? "Program name already exists in this department"
          : "Unable to save this program. Review its details.",
      }, { status: error.code === "DEPARTMENT_NOT_FOUND" ? 404 : 409 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({
        error: "INVALID_REQUEST",
        fieldErrors: programCreateFieldErrors(error),
        message: "Please review the program details.",
      }, { status: 400 });
    }
    return apiErrorResponse(error);
  }
}
