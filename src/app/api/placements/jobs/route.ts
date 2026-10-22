import { NextResponse } from "next/server";
import {z} from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {hasMembershipRole} from "@/modules/identity/context";
import {listLearnerPlacementJobs} from "@/modules/placements/learner-job-service";
import {DEFAULT_LEARNER_JOB_FILTERS,filterLearnerPlacementJobs} from "@/modules/placements/learner-jobs-browse-model";
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
const LEGACY_JOB_SEARCH_COMPATIBILITY={
 search:"GET /api/placements/jobs?mode=search",
 popular:"GET /api/placements/jobs?mode=search&sort=POSTED_DESC",
 category:"GET /api/placements/jobs?mode=search&applicationMode=...",
 categories:"college-scoped job-type settings (not a public catalog)",
 organization:"retired: requires explicit acting-college permission",
 department:"learner-specific eligibility feed, never a global catalog",
 program:"learner-specific eligibility feed, never a global catalog",
 stats:"college-scoped placement reporting",
 refresh:"no shared in-memory cache; queries always read current database state",
 // Old /api/v2/jobs/{search,popular,category,organizations,refresh} is
 // intentionally NOT exposed without authentication. Every surviving
 // consumer must select an authorized college before querying this route.
 legacyOrganizations:["42Learn","External Companies"],
 resultCopy:{search:"Jobs retrieved",popular:"Popular jobs retrieved"},
 refreshPolicy:"SQL reads current committed state; writes require no in-process cache eviction",
} as const;
const searchInput=z.object({
 mode:z.enum(["list","search"]).default("list"),
 q:z.string().trim().max(120).default(""),
 status:z.enum(["ALL","DRAFT","PUBLISHED","CLOSED","CANCELLED","ARCHIVED"]).default("ALL"),
 sort:z.enum(["POSTED_DESC","POSTED_ASC","DEADLINE_ASC","DEADLINE_DESC","TITLE_ASC"]).default("POSTED_DESC"),
 applicationMode:z.enum(["ALL","INTERNAL","HYBRID","EXTERNAL_ONLY"]).default("ALL"),
 jobType:z.string().trim().max(100).default(""),
 programId:z.string().uuid().optional(),
 deptId:z.string().uuid().optional(),
 learnerId:z.string().uuid().optional(),
 page:z.coerce.number().int().min(0).max(9999).default(0),
 size:z.coerce.number().int().min(1).max(100).default(50),
}).strict();


export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const collegeId = url.searchParams.get("collegeId") ?? context.adminScope?.collegeId ?? context.membership?.collegeId ?? "";
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
      const supported=new Set(["collegeId","mode","query","q","status","sort",
        "applicationMode","page","limit","size","jobType","programId",
        "deptId","departmentId","learnerId"]);
      if([...url.searchParams.keys()].some(key=>!supported.has(key)||
         url.searchParams.getAll(key).length!==1)||
         (url.searchParams.has("query")&&url.searchParams.has("q"))||
         (url.searchParams.has("deptId")&&url.searchParams.has("departmentId"))||
         (url.searchParams.has("limit")&&url.searchParams.has("size")))
        return NextResponse.json({error:"INVALID_JOB_SEARCH",
          message:"Choose one valid value for each job search filter."},{status:400});
      const parsed=searchInput.safeParse({
        mode:"search",q:url.searchParams.get("query")??url.searchParams.get("q")??"",
        status:url.searchParams.get("status")??"ALL",
        sort:url.searchParams.get("sort")??"POSTED_DESC",
        applicationMode:url.searchParams.get("applicationMode")??"ALL",
        jobType:url.searchParams.get("jobType")??"",
        programId:url.searchParams.get("programId")??undefined,
        deptId:url.searchParams.get("deptId")??url.searchParams.get("departmentId")??undefined,
        learnerId:url.searchParams.get("learnerId")??undefined,
        page:url.searchParams.get("page")??0,size:url.searchParams.get("limit")??
          url.searchParams.get("size")??50,
      });
      if(!parsed.success)return NextResponse.json({error:"INVALID_JOB_SEARCH",
        message:"Choose valid job search filters and retry."},{status:400});
      if(parsed.data.learnerId){
        // Legacy learnerId is never an impersonation switch. Its only safe
        // equivalent is the active learner's own role-and-college feed.
        if(!context.membership||!hasMembershipRole(context,"LEARNER")||
           parsed.data.learnerId!==context.membership.id)
          return NextResponse.json({error:"FORBIDDEN"},{status:403});
        if(parsed.data.programId||parsed.data.deptId)
          return NextResponse.json({error:"INVALID_JOB_SEARCH",
            message:"Learner program and department come from your active enrollment."},
            {status:400});
        const own=await listLearnerPlacementJobs(context);
        // One authenticated, audience-scoped source powers both job cards
        // and typeahead. The legacy search combines title, employer,
        // description, responsibilities, job type, location and academic
        // targeting rather than silently limiting matches to two fields.
        const normalized=own.map(item=>({
          ...item,
          job:{...item.job,
            applicationDeadline:item.job.applicationDeadline?.toISOString()??null,
            publishedAt:item.job.publishedAt?.toISOString()??null,
            responsibilities:item.job.legacyPostingDetails?.responsibilities??null,
          },
        }));
        const permitted=normalized.filter(item=>
          (parsed.data.status==="ALL"||parsed.data.status==="PUBLISHED")&&
          (parsed.data.applicationMode==="ALL"||
            item.job.applicationMode===parsed.data.applicationMode));
        const filtered=filterLearnerPlacementJobs(permitted,{
          ...DEFAULT_LEARNER_JOB_FILTERS,
          search:parsed.data.q,
          jobType:parsed.data.jobType||undefined,
          sort:"newest",
        });
        const ordered=parsed.data.sort==="TITLE_ASC"?
          [...filtered].sort((a,b)=>a.job.title.localeCompare(b.job.title)):
          parsed.data.sort==="POSTED_ASC"?[...filtered].reverse():filtered;
        const begin=parsed.data.page*parsed.data.size;
        const subset=ordered.slice(begin,begin+parsed.data.size);
        return NextResponse.json({success:true,content:subset,jobs:subset,
          message:LEGACY_JOB_SEARCH_COMPATIBILITY.resultCopy.search,
          source:"OWN_LEARNER_SCOPE",page:parsed.data.page,size:parsed.data.size,
          totalElements:ordered.length,totalPages:Math.ceil(ordered.length/parsed.data.size),
          empty:subset.length===0,retryable:false},
          {headers:{"Cache-Control":"private, no-store"}});
      }
      const page=await listPlacementJobsPage(context,collegeId,{
        q:parsed.data.q,status:parsed.data.status,sort:parsed.data.sort,
        applicationMode:parsed.data.applicationMode,
        jobType:parsed.data.jobType,programId:parsed.data.programId,deptId:parsed.data.deptId,
        page:parsed.data.page+1,pageSize:parsed.data.size,
      });
      return NextResponse.json({
        success:true,content:page.items,jobs:page.items,
        // The old response included a measured milliseconds string.
        // Such timings belong in request telemetry, not fabricated UI copy.
        message:LEGACY_JOB_SEARCH_COMPATIBILITY.resultCopy.search,
        source:"COLLEGE_SCOPED_DATABASE",
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
    if(response.status>=500){
      response.headers.set("Retry-After","5");
      // Differentiate a transient failed read from a genuinely empty search.
      return NextResponse.json({
        error:"JOB_SEARCH_UNAVAILABLE",
        message:"Job search could not be loaded. Retry this search.",
        retryable:true,requestId:response.headers.get("x-request-id"),
      },{status:response.status,headers:response.headers});
    }
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
