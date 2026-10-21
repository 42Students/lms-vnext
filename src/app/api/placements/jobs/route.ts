import { NextResponse } from "next/server";
import {z} from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createPlacementJob,
  listPlacementJobs,
  listPlacementJobsPage,
} from "@/modules/placements/job-service";

export const runtime = "nodejs";

/** The old /api/v2/jobs/search reader was a global cache. This replacement
 * is scoped by authenticated college membership and uses indexed SQL paging.
 * Legacy organization/catalog/category probes MUST NOT cross tenant borders.
 */
export const LEGACY_JOB_SEARCH_COMPATIBILITY={
 search:"GET /api/placements/jobs?mode=search",
 popular:"GET /api/placements/jobs?mode=search&sort=POSTED_DESC",
 category:"GET /api/placements/jobs?mode=search&applicationMode=...",
 categories:"college-scoped job-type settings (not a public catalog)",
 organization:"retired: requires explicit acting-college permission",
 department:"learner-specific eligibility feed, never a global catalog",
 program:"learner-specific eligibility feed, never a global catalog",
 stats:"college-scoped placement reporting",
 refresh:"no shared in-memory cache; queries always read current database state",
} as const;
const searchInput=z.object({
 mode:z.enum(["list","search"]).default("list"),
 q:z.string().trim().max(120).default(""),
 status:z.enum(["ALL","DRAFT","PUBLISHED","CLOSED","CANCELLED","ARCHIVED"]).default("ALL"),
 sort:z.enum(["POSTED_DESC","POSTED_ASC","DEADLINE_ASC","DEADLINE_DESC","TITLE_ASC"]).default("POSTED_DESC"),
 applicationMode:z.enum(["ALL","INTERNAL","HYBRID","EXTERNAL_ONLY"]).default("ALL"),
 page:z.coerce.number().int().min(0).max(9999).default(0),
 size:z.coerce.number().int().min(1).max(100).default(20),
}).strict();


export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const collegeId = url.searchParams.get("collegeId") ?? context.membership?.collegeId ?? "";
    if(!collegeId)return NextResponse.json({
      error:"COLLEGE_CONTEXT_REQUIRED",
      message:"Organization context required for job search. Provide learnerId or ensure authentication.",
      retryable:false,
    },{status:400,headers:{"Cache-Control":"no-store"}});
    const requestedMode=url.searchParams.get("mode")??"list";
    if(requestedMode!=="search"&&requestedMode!=="list")
      return NextResponse.json({error:"INVALID_SEARCH_MODE",message:"Choose a valid job search mode."},
        {status:400});
    if(requestedMode==="search"){
      const parsed=searchInput.safeParse({
        mode:"search",q:url.searchParams.get("query")??url.searchParams.get("q")??"",
        status:url.searchParams.get("status")??"ALL",
        sort:url.searchParams.get("sort")??"POSTED_DESC",
        applicationMode:url.searchParams.get("applicationMode")??"ALL",
        page:url.searchParams.get("page")??0,size:url.searchParams.get("limit")??
          url.searchParams.get("size")??20,
      });
      if(!parsed.success)return NextResponse.json({error:"INVALID_JOB_SEARCH",
        message:"Choose valid job search filters and retry."},{status:400});
      const page=await listPlacementJobsPage(context,collegeId,{
        q:parsed.data.q,status:parsed.data.status,sort:parsed.data.sort,
        applicationMode:parsed.data.applicationMode,page:parsed.data.page+1,
        pageSize:[10,20,50,100].includes(parsed.data.size)?parsed.data.size:20,
      });
      return NextResponse.json({
        success:true,content:page.items,jobs:page.items,
        page:parsed.data.page,size:page.pageSize,
        totalElements:page.totalCount,totalPages:page.totalPages,
        empty:page.empty,retryable:false,
      },{headers:{"Cache-Control":"private, no-store"}});
    }
    // The original list shape remains unchanged for existing vNext callers.
    const jobs = await listPlacementJobs(context, collegeId);
    return NextResponse.json({ jobs },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    // Never reinterpret a failed database read as an empty job catalog.
    const response=apiErrorResponse(error);
    response.headers.set("Cache-Control","private, no-store");
    if(response.status>=500)response.headers.set("Retry-After","5");
    return response;
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }

  try {
    const context = await getCurrentRequestContext();
    const body = await request.json();
    const job = await createPlacementJob(context, body);
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
