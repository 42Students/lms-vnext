import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {publishAssignmentGradeBatch} from "@/modules/courses/assignment-bulk-grade-publish-service";

export const runtime="nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {assignmentId}=params;
    const body=await request.json();
    const receipt=await publishAssignmentGradeBatch(context,assignmentId,body);
    return NextResponse.json(receipt,{headers:{"Cache-Control":"private, no-store"}});
  },
);
