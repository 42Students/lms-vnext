import {NextResponse} from "next/server";
import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {TpoPrepError,assignTpoPrepCourse,listTpoPrepCourseOptions} from "@/modules/placements/tpo-prep-assignment-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
 try{return NextResponse.json({courses:await listTpoPrepCourseOptions(await getCurrentRequestContext())},
  {headers:{"Cache-Control":"private, no-store"}});}
 catch(error){if(error instanceof TpoPrepError)return NextResponse.json({error:error.code},{status:503});return apiErrorResponse(error);}
}
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
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
  // The legacy endpoint accepted a numeric assessmentId, but no reviewed
  // vNext assessment-resource FK exists in the prep-assignment table. Never
  // silently discard a requested quiz/test or falsely claim it was assigned.
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
  return NextResponse.json(await assignTpoPrepCourse(await getCurrentRequestContext(),{
   offeringId,membershipIds,dueAt:base.data.dueAt??null,
  }),{headers:{"Cache-Control":"private, no-store"}});
 }
 catch(error){if(error instanceof TpoPrepError)return NextResponse.json({error:error.code},{status:error.code==="UNAVAILABLE"?503:409});
  return apiErrorResponse(error);}
}
