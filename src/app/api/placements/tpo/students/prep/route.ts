import { boundedRequestJson } from "@/lib/request-body";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {TpoPrepError,assignTpoPrepCourse,listTpoPrepCourseOptions} from "@/modules/placements/tpo-prep-assignment-service";
import { CACHE } from "@/security/responses";
import { zUuid } from "@/lib/schema-primitives";
export const runtime="nodejs";export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    try {
return NextResponse.json({courses:await listTpoPrepCourseOptions(__ctx)},
  {headers:{"Cache-Control":CACHE.PRIVATE}});
} catch(error){if(error instanceof TpoPrepError)return NextResponse.json({error:error.code},{status:503});return apiErrorResponse(error);}
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    try {
const payload=await boundedRequestJson(request) as unknown;
const base=z.strictObject({
   offeringId:zUuid.optional(),courseId:zUuid.optional(),
   membershipIds:z.array(zUuid).min(1).max(100).optional(),
   learnerIds:z.array(zUuid).min(1).max(100).optional(),
   dueAt:z.iso.datetime({offset:true}).nullable().optional(),
   assessmentId:z.union([zUuid,z.number().int().positive()]).nullable().optional(),
  }).safeParse(payload);
if(!base.success)
   return NextResponse.json({error:"INVALID_PREP_SELECTION",details:base.error.flatten()},
    {status:400,headers:{"Cache-Control":CACHE.PRIVATE}});
if(base.data.assessmentId!=null)
   return NextResponse.json({
    error:"ASSESSMENT_REFERENCE_UNAVAILABLE",
    message:"Prep tests cannot be assigned until their course assessment mapping is available. Select a course offering instead.",
   },{status:422,headers:{"Cache-Control":CACHE.PRIVATE}});
const offeringId=base.data.offeringId??base.data.courseId;
const membershipIds=base.data.membershipIds??base.data.learnerIds;
if(!offeringId||!membershipIds)
   return NextResponse.json({error:"INVALID_PREP_SELECTION",
    message:"Choose an active course offering and at least one learner."},
    {status:422,headers:{"Cache-Control":CACHE.PRIVATE}});
return NextResponse.json(await assignTpoPrepCourse(__ctx,{
   offeringId,membershipIds,dueAt:base.data.dueAt??null,
  }),{headers:{"Cache-Control":CACHE.PRIVATE}});
} catch(error){if(error instanceof TpoPrepError)return NextResponse.json({error:error.code},{status:error.code==="UNAVAILABLE"?503:409});
  return apiErrorResponse(error);}
  },
);
