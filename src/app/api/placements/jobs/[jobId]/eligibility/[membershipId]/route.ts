import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {isSuperAdmin} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {AuthorizationError} from "@/modules/permissions/policy";
import {getPlacementJob} from "@/modules/placements/job-service";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import {z} from "zod";
import {placementEligibilityOverrideInputSchema} from "@/modules/placements/validation";
import {
  evaluatePlacementEligibility,
  revokeEligibilityOverride,
  setEligibilityOverride,
} from "@/modules/placements/eligibility-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    jobId: string;
    membershipId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const context = await getCurrentRequestContext();
    // A direct eligibility read exposes student academic evidence and
    // effective overrides. Recheck the current TPO/College Admin membership
    // before accepting a job ID from a stale browser session.
    const { jobId, membershipId } = await params;
    if(isSuperAdmin(context)){
      // A globally privileged role is not a license to read student evidence
      // outside its explicitly selected and still-active acting college.
      const acting=await resolveActingCollege(context,"placements.manage");
      const job=await getPlacementJob(context,jobId);
      if(job.collegeId!==acting.collegeId)
        throw new AuthorizationError("placements.manage");
    }else{
      await requireTpoBatchActor(context);
    }
    const eligibility =
      await evaluatePlacementEligibility(
        context,
        jobId,
        membershipId,
      );
    return NextResponse.json({ eligibility });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/** Both legacy POST and modern PUT use the same tenant-scoped membership
 * identity and optimistic override receipt. Never accept a raw legacy numeric
 * learnerId as a UUID or infer a college from the caller's JSON payload. */
async function updateOverride(request:Request,{params}:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const {jobId,membershipId}=await params;
  const raw:unknown=await request.json().catch(()=>null);
  if(!raw||typeof raw!=="object"||Array.isArray(raw))
   return NextResponse.json({error:"INVALID_REQUEST",message:"Choose include or exclude."},{status:400});
  const record=raw as Record<string,unknown>;
  // Legacy named this field type; the canonical membership UUID is provided
  // in the route, rather than resolving untrusted foreign numeric user IDs.
  if(record["learnerId"]!==undefined&&record["learnerId"]!==membershipId)
   return NextResponse.json({error:"INVALID_LEARNER",message:"Learner selection has changed. Refresh the drive."},{status:400});
  // The historical editor sends a nullable Boolean override + note.
  // true/false map to INCLUDE/EXCLUDE, while null explicitly clears the
  // currently selected override. A mixed legacy/canonical decision is not
  // allowed to mask a conflicting choice.
  const hasLegacyOverride=Object.prototype.hasOwnProperty.call(record,"override");
  if(hasLegacyOverride&&(record["decision"]!==undefined||record["type"]!==undefined))
   return NextResponse.json({error:"INVALID_ELIGIBILITY_OVERRIDE",
    message:"Choose one eligibility decision format."},{status:400});
  if(hasLegacyOverride&&record["override"]!==null&&typeof record["override"]!=="boolean")
   return NextResponse.json({error:"INVALID_ELIGIBILITY_OVERRIDE",
    message:"Override must be true, false or null."},{status:400});
  if(hasLegacyOverride&&record["override"]===null){
   const clear=z.strictObject({
     expectedOverrideId:z.string().uuid().optional(),
     reason:z.string().trim().min(3).max(500).optional(),
   }).safeParse({
     ...(record["expectedOverrideId"]!==undefined?{expectedOverrideId:record["expectedOverrideId"]}:{}),
     ...(record["note"]!==undefined||record["reason"]!==undefined?
       {reason:record["reason"]??record["note"]}:{}),
   });
   if(!clear.success)return NextResponse.json({error:"INVALID_ELIGIBILITY_OVERRIDE",
     message:"The override could not be cleared."},{status:400});
   const override=await revokeEligibilityOverride(context,jobId,membershipId,{
     ...(clear.data.expectedOverrideId !== undefined ? {expectedOverrideId:clear.data.expectedOverrideId} : {}),
     ...(clear.data.reason !== undefined ? {reason:clear.data.reason} : {}),
   });
   return NextResponse.json({override,ok:true,message:"Eligibility override cleared."},
     {headers:{"Cache-Control":"private, no-store"}});
  }
  const candidate={
   decision:hasLegacyOverride?(record["override"]?"INCLUDE":"EXCLUDE"):
     record["decision"]??record["type"],
   reason:record["reason"]??record["note"],
   expectedOverrideId:record["expectedOverrideId"]??null,
  };
  if(typeof candidate.reason!=="string"||candidate.reason.trim().length<3)
   return NextResponse.json({error:"INVALID_REASON",message:"A reason is required."},
    {status:400,headers:{"Cache-Control":"private, no-store"}});
  const parsed=placementEligibilityOverrideInputSchema.safeParse(candidate);
  if(!parsed.success)
   return NextResponse.json({error:"INVALID_ELIGIBILITY_OVERRIDE",
     message:"Choose include or exclude."},{status:400,headers:{"Cache-Control":"private, no-store"}});
  // Present-day editors always send an expectedOverrideId. The old
  // POST equivalent may only create when no override already exists.
  const override=await setEligibilityOverride(context,jobId,membershipId,parsed.data);
  return NextResponse.json({override,ok:true,message:"Eligibility override saved.",
   expectedOverrideId:override?.id},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export async function PUT(request:Request,route:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 return updateOverride(request,route);
}
export async function POST(request:Request,route:RouteContext){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 return updateOverride(request,route);
}

export async function DELETE(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }
  try {
    const context = await getCurrentRequestContext();
    const { jobId, membershipId } = await params;
    const raw=request.headers.get("content-type")?.startsWith("application/json")
      ?await request.json():{};
    const options=z.object({
      expectedOverrideId:z.string().uuid().optional(),
      reason:z.string().trim().min(3).max(500).optional(),
    }).strict().parse(raw);
    const override =
      await revokeEligibilityOverride(
        context,
        jobId,
        membershipId,
        {
          ...(options.expectedOverrideId !== undefined ? {expectedOverrideId:options.expectedOverrideId} : {}),
          ...(options.reason !== undefined ? {reason:options.reason} : {}),
        },
      );
    return NextResponse.json({ override });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
