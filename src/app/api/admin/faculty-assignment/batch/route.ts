import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {readBoundedJsonRequest} from "@/lib/request-body";
import {createCourseTeachingAssignmentsBatch} from "@/modules/courses/teaching-assignment-batch-service";

import { CACHE } from "@/security/responses";
export const runtime="nodejs";

/** SA-academics-people-101: create 1–10 faculty/course grants atomically.
 * Missing/invalid authenticated session is handled by apiErrorResponse (401).
 * Same-origin CSRF failures remain 403 even if the old endpoint returned 401.
 */
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const _p=await readBoundedJsonRequest(request,16384);
    if(!_p.ok)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const body:unknown=_p.value;
    if(body&&typeof body==="object"&&!Array.isArray(body)){
    const fields=body as Record<string,unknown>;
    if(fields.courseId!==undefined||fields.courseIds!==undefined)
      return NextResponse.json({error:"DELIVERY_IDS_REQUIRED",
        message:"Select a Section and its course deliveries before assigning faculty."},
        {status:400});
  }
    const assignments=await createCourseTeachingAssignmentsBatch(context,body);
    return NextResponse.json({assignments,createdCount:assignments.length,
    message:assignments.length===1?"Assignment created successfully":
      assignments.length+" assignments created"},{status:201,
    headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
