import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { listPrograms } from "@/modules/academics/program-service";
import { scopedProgramPopularity } from "@/modules/academics/legacy-program-popularity";
import {parseLegacyProgramPage,legacyProgramPage} from "@/modules/admin-ui/legacy-program-page-model";
import {
  CollegeProgramMutationError,
  createCollegeProgram,
} from "@/modules/academics/college-program-mutation-service";

export const runtime = "nodejs";

const legacySearchSchema = z.object({
  mode: z.enum(["search","popular","department","categories","category","exists","stats"]).optional(),
  query: z.string().max(100).default(""),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  department: z.string().max(255).optional(),
  name: z.string().max(255).optional(),
});

/** This is an on-demand, permission-checked adapter: the old /api/v2/programs
 * cached search/select/refresh API never determines college scope here.
 * Caller identities are canonical UUIDs and numeric historical IDs are not
 * accepted in request-time queries. */
function legacyProgramSearch<T extends {
  id: string;name: string;code: string;departmentId: string;
  departmentName: string;durationTerms: number;legacyProgramId?: number | null;
}>(rows: readonly T[], parameters: URLSearchParams, collegeId: string) {
  const parsed = legacySearchSchema.parse({
    mode: parameters.get("mode") ?? undefined,
    query: parameters.get("query") ?? parameters.get("q") ?? "",
    limit: parameters.get("limit") ?? undefined,
    department: parameters.get("department") ?? undefined,
    name: parameters.get("name") ?? undefined,
  });
  const query = parsed.query.trim().toLocaleLowerCase("en");
  const rowsForDepartment = parsed.department
    ? rows.filter(row => row.departmentName.toLocaleLowerCase("en") ===
        parsed.department!.trim().toLocaleLowerCase("en"))
    : rows;
  const matches = rowsForDepartment.filter(row => {
    if (!query) return true;
    const text = (row.name+" "+row.code+" "+row.departmentName).toLocaleLowerCase("en");
    const expanded = query === "btech" ? "b.tech" : query === "mtech" ? "m.tech" :
      query === "mba" ? "business administration" : query;
    return text.includes(query) || text.includes(expanded);
  });
  const sorted = [...matches].sort((a, b) => {
    const score = (row: T) => {
      const name = row.name.toLocaleLowerCase("en");
      return !query ? 0 : name === query ? 100 :
        name.startsWith(query) ? 80 :
        name.split(/\s+/).some(word => word.startsWith(query)) ? 60 :
        name.includes(query) ? 40 : 0;
    };
    return (parsed.mode === "popular"
      ? scopedProgramPopularity(collegeId,b.id) - scopedProgramPopularity(collegeId,a.id) : 0) ||
      score(b)-score(a) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  });
  const mode = parsed.mode ?? "search";
  if (mode === "categories") return { status:"success",message:"Categories retrieved",
    data:[...new Set(rows.map(row => row.departmentName))].sort((a,b)=>a.localeCompare(b)) };
  if (mode === "stats") return { status:"success",message:"Program stats retrieved",
    data:{totalPrograms:rows.length,departments:new Set(rows.map(row=>row.departmentId)).size} };
  if (mode === "exists") return { status:"success",message:"Program existence checked",
    data: rows.some(row=>row.name.toLocaleLowerCase("en") ===
      (parsed.name ?? parsed.query).trim().toLocaleLowerCase("en")) };
  const limit = parsed.limit ?? (mode === "department" || mode === "category" ? 50 :
    mode === "popular" ? 10 : 15);
  return {status:"success",message:"Programs retrieved",
    data:sorted.slice(0,limit).map(row=>({
      id:row.id, legacyId:row.legacyProgramId??null, name:row.name,deptId:row.departmentId,deptName:row.departmentName,
      code:row.code,durationYears:row.durationTerms/2,scope:"COLLEGE",
    })),total:sorted.length,limit};
}

function legacyProgramCreateInput(raw: unknown) {
  const source=z.record(z.string(),z.unknown()).parse(raw);
  const name=typeof source.name==="string"?source.name.trim():"";
  const code=typeof source.code==="string"&&source.code.trim()?source.code.trim():
    name.toUpperCase().replace(/[^A-Z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,64);
  const years=source.durationYears??source.duration_years;
  return {
    departmentId:source.departmentId??source.dept_id??source.deptId,
    name,code,
    durationTerms:source.durationTerms??(
      typeof years==="number"?years*2:typeof years==="string"&&years.trim()?
        Number(years)*2:undefined),
  };
}


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
    const mode=url.searchParams.get("mode");
    const departmentId=url.searchParams.get("departmentId") ?? url.searchParams.get("deptId");
    const programs = await listPrograms(
      context,
      url.searchParams.get("collegeId") ?? "",
      departmentId,
    );
    if (mode || url.searchParams.has("query") || url.searchParams.has("q")) {
      const legacy=legacyProgramSearch(programs,url.searchParams,url.searchParams.get("collegeId") ?? "");
      return NextResponse.json(legacy,{headers:{"Cache-Control":"private, no-store"}});
    }
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
    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({error:"INVALID_REQUEST",message:"Enter valid program details."},{status:400}); }
    const legacy=new URL(request.url).searchParams.get("legacy")==="1";
    const program = await createCollegeProgram(context, legacy?legacyProgramCreateInput(body):body);
    return NextResponse.json(legacy
      ? {status:"OK",message:"Program created successfully",data:program}
      : { program }, { status: legacy?200:201 });
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
