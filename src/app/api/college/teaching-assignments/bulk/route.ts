import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createCourseTeachingAssignment } from "@/modules/courses/teaching-assignment-service";

export const runtime = "nodejs";
const inputSchema = z.object({
  membershipId: z.string().uuid(),
  deliveryIds: z.array(z.string().uuid()).min(1).max(50),
  role: z.enum(["PRIMARY", "CO_TEACHER", "TA"]),
}).strict();

/** Batch API deliberately reports each delivery's outcome, including
 * conflicts, rather than claiming the entire action succeeded. */
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const input = inputSchema.parse(await boundedRequestJson(request, 8 * 1024 * 1024));
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
  },
);
