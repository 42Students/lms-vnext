import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  archivePlacementJob,
  getPlacementJob,
  updatePlacementJob,
} from "@/modules/placements/job-service";
import {updatePlacementJobInputSchema,placementJobIdSchema} from "@/modules/placements/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const { jobId } = await params;
    const job = await getPlacementJob(
      context,
      jobId,
    );
    return NextResponse.json({ job });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }

  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    const body = await request.json();
    const job = await updatePlacementJob(context, jobId, body);
    return NextResponse.json(job);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }

  try {
    const context = await getCurrentRequestContext();
    const { jobId } = await params;
    if(!placementJobIdSchema.safeParse(jobId).success)
      return NextResponse.json({error:"PLACEMENT_JOB_NOT_FOUND",
        message:"The drive link is invalid or the drive no longer exists."},{status:404});
    // Legacy organization-wide job records allowed a null college. VNext's
    // placement_jobs.college_id is intentionally NOT NULL; allowing a query
    // argument to stand in for a nonexistent organization-wide tenant would
    // bypass the existing college membership authorization. Archive the
    // persisted job in its actual college using the service's policy/CAS.
    // A future org-wide model needs explicit schema and permission support.
    const job = await archivePlacementJob(context, jobId);
    return NextResponse.json(job,{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/** PUT adapter for historic job editors. It never chooses a tenant or creates
 * a new job; the existing UUID scope, draft-only policy and CAS remain in
 * updatePlacementJob. Unsupported source fields cannot silently disappear. */
export async function PUT(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const body:unknown=await request.json().catch(()=>null);
 if(!body||typeof body!=="object"||Array.isArray(body))
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
 const wrapped=body as Record<string,unknown>;
 const payload=wrapped.job??body;
 if(!payload||typeof payload!=="object"||Array.isArray(payload))
  return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
 const source=payload as Record<string,unknown>;
 const aliases:Readonly<Record<string,string>>={
  jobTitle:"title",jobDescription:"description",numberOfOpenings:"openings",
  minimumCtc:"minimumAnnualCtcInr",maximumCtc:"maximumAnnualCtcInr",
  applicationLink:"externalApplicationUrl",deadline:"applicationDeadline",
 };
 const allowed=new Set([
  "title","description","employmentType","jobTypeLabel","workMode",
  "locations","openings","minimumAnnualCtcInr","maximumAnnualCtcInr",
  "applicationMode","externalApplicationUrl","applicationDeadline",
  "legacyPostingDetails",
 ]);
 const next:Record<string,unknown>={};
 for(const [key,value] of Object.entries(source)){
  const target=aliases[key]??key;
  if(!allowed.has(target)||Object.hasOwn(next,target))
   return NextResponse.json({error:"UNSUPPORTED_LEGACY_FIELD",field:key},
    {status:400});
  next[target]=value;
 }
 if(Object.keys(next).length===0)
  return NextResponse.json({error:"EMPTY_BODY"},{status:400});
 try{
  const {jobId}=await params;
  const validated=updatePlacementJobInputSchema.parse(next);
  const job=await updatePlacementJob(await getCurrentRequestContext(),jobId,validated);
  return NextResponse.json({job},{
   headers:{"Cache-Control":"private, no-store","Deprecation":"true"},
  });
 }catch(error){return apiErrorResponse(error);}
}
