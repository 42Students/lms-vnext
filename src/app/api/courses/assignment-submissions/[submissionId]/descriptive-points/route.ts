import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {addDescriptiveAssignmentPoints} from "@/modules/courses/assignment-submission-service";
import {descriptiveAssignmentPointsSchema} from "@/modules/courses/assignment-descriptive-points-model";

export const runtime="nodejs";
type Params={params:Promise<{submissionId:string}>};
export const POST = route(
  { auth: "user", permission: "courses.manage" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {submissionId}=params;
const input=descriptiveAssignmentPointsSchema.parse(await boundedRequestJson(request));
const submission=await addDescriptiveAssignmentPoints(
   __ctx,submissionId,input,
  );
return NextResponse.json({submission},{headers:{"Cache-Control":"no-store"}});
} catch(error){
  if(error instanceof RangeError)
   return NextResponse.json({error:"ASSIGNMENT_GRADE_INVALID",
    message:"Descriptive points exceed the assignment maximum."},
    {status:400,headers:{"Cache-Control":"no-store"}});
  return apiErrorResponse(error);
 }
  },
);
