import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {TpoPrepError,assignTpoPrepCourse,listTpoPrepCourseOptions} from "@/modules/placements/tpo-prep-assignment-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    return NextResponse.json({courses:await listTpoPrepCourseOptions(__ctx)},
  {headers:{"Cache-Control":"private, no-store"}});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const payload=await request.json() as unknown;
    const base=z.strictObject({
   offeringId:z.uuid().optional(),courseId:z.uuid().optional(),
   membershipIds:z.array(z.uuid()).min(1).max(100).optional(),
   learnerIds:z.array(z.uuid()).min(1).max(100).optional(),
   dueAt:z.iso.datetime({offset:true}).nullable().optional(),
   assessmentId:z.union([z.uuid(),z.number().int().positive()]).nullable().optional(),
  }).safeParse(payload);
    if(!base.success)
   return NextResponse.json({error:"INVALID_PREP_SELECTION",details:base.error.flatten()},
    {status:400,headers:{"Cache-Control":"private, no-store"}});
    if(base.data.assessmentId!=null)
   return NextResponse.json({
    error:"ASSESSMENT_REFERENCE_UNAVAILABLE",
    message:"Prep tests cannot be assigned until their course assessment mapping is available. Select a course offering instead.",
   },{status:422,headers:{"Cache-Control":"private, no-store"}});
    const offeringId=base.data.offeringId??base.data.courseId;
    const membershipIds=base.data.membershipIds??base.data.learnerIds;
    if(!offeringId||!membershipIds)
   return NextResponse.json({error:"INVALID_PREP_SELECTION",
    message:"Choose an active course offering and at least one learner."},
    {status:422,headers:{"Cache-Control":"private, no-store"}});
    return NextResponse.json(await assignTpoPrepCourse(__ctx,{
   offeringId,membershipIds,dueAt:base.data.dueAt??null,
  }),{headers:{"Cache-Control":"private, no-store"}});
  },
);
