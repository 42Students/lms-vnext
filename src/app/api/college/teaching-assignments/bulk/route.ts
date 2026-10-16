import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { createCourseTeachingAssignment } from "@/modules/courses/teaching-assignment-service";

export const runtime = "nodejs";
const inputSchema = z.object({
  membershipId: z.string().uuid(),
  deliveryIds: z.array(z.string().uuid()).min(1).max(50),
  role: z.enum(["PRIMARY", "CO_TEACHER", "TA"]),
}).strict();

/** Batch API deliberately reports each delivery's outcome, including
 * conflicts, rather than claiming the entire action succeeded. */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  try {
    const context = await getCurrentRequestContext();
    const input = inputSchema.parse(await request.json());
    if (new Set(input.deliveryIds).size !== input.deliveryIds.length)
      return NextResponse.json({ error: "DUPLICATE_DELIVERY" }, { status: 400 });
    const created: string[] = [];
    const failed: Array<{ deliveryId: string; reason: string }> = [];
    for (const deliveryId of input.deliveryIds) {
      try {
        await createCourseTeachingAssignment(context, {
          deliveryId, membershipId: input.membershipId, role: input.role,
        });
        created.push(deliveryId);
      } catch (error) {
        failed.push({ deliveryId,
          reason: error instanceof Error ? error.message : "Assignment refused" });
      }
    }
    return NextResponse.json({ created, failed, partial: failed.length > 0 });
  } catch (error) { return apiErrorResponse(error); }
}
