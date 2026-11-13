import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {
 readFacultyAssignmentCommandBody,FacultyAssignmentBodyError,
} from "@/modules/courses/faculty-assignment-request-body";
import {
 listFacultyAssignmentResources,presignFacultyAssignmentResource,
} from "@/modules/courses/faculty-assignment-resource-service";

import { CACHE, privateJson } from "@/security/responses";
export const runtime="nodejs";
type Params={params:Promise<{deliveryId:string}>};

/** Return resources only after checking persisted teaching scope and the
 * assignment's exact delivery. Never send a signed object URL in a listing. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    const {deliveryId}=params;
    const assignmentId=new URL(request.url).searchParams.get("assignmentId")??"";
    const result=await listFacultyAssignmentResources(
   __ctx,deliveryId,assignmentId);
    return privateJson(result);
  },
);

/** A private presigned PUT is only an upload grant. The assignment command
 * verifies college/membership ownership and scanner CLEAN attestation before
 * persisting any PDF or FILE resource. */
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor, params }) => {
    const __ctx = __actor!;
    try {
const {deliveryId}=params;
const body=await readFacultyAssignmentCommandBody(request);
const grant=await presignFacultyAssignmentResource(
   __ctx,deliveryId,body);
return privateJson({grant});
} catch(error){
  if(error instanceof FacultyAssignmentBodyError)
   return NextResponse.json({error:error.code},{
    status:error.status,headers:{"Cache-Control":CACHE.PRIVATE}});
  return apiErrorResponse(error);
 }
  },
);
