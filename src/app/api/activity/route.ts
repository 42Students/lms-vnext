import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listActivityEvents } from "@/modules/activity/service";

export const runtime = "nodejs";

function value(
  params: URLSearchParams,
  name: string,
) {
  const result = params.get(name);
  return result?.trim()
    ? result.trim()
    : undefined;
}

export async function GET(
  request: Request,
) {
  try {
    const context =
      await getCurrentRequestContext();
    const params = new URL(
      request.url,
    ).searchParams;
    const result =
      await listActivityEvents(
        context,
        {
          collegeId: value(
            params,
            "collegeId",
          ),
          organizationId: value(
            params,
            "organizationId",
          ),
          module: value(
            params,
            "module",
          ) as
            | "PLATFORM"
            | "IDENTITY"
            | "ACADEMICS"
            | "COURSES"
            | "PROJECTS"
            | "PLACEMENTS"
            | undefined,
          importance: value(
            params,
            "importance",
          ) as
            | "LOW"
            | "NORMAL"
            | "HIGH"
            | "CRITICAL"
            | undefined,
          actorUserId: value(params,"actorUserId")??value(params,"actorId"),
          eventType: value(
            params,
            "eventType",
          ),
          subjectType:value(params,"subjectType")??value(params,"targetType"),
          from:value(params,"from")??value(params,"startDate"),
          to:value(params,"to")??value(params,"endDate"),
          beforeOccurredAt: value(
            params,
            "beforeOccurredAt",
          ),
          beforeId: value(
            params,
            "beforeId",
          ),
          limit:
            value(params, "limit") ??
            "40",
        },
      );

    // Add truthful name dictionaries for legacy audit list adapters without
    // pretending that cursor pagination provides an absolute page or total.
    const actorNames=Object.fromEntries(result.items
      .filter(row=>row.actor?.id&&row.actor.displayName)
      .map(row=>[row.actor!.id!,row.actor!.displayName!]));
    const targetNames=Object.fromEntries(result.items
      .filter(row=>row.event.subjectId&&row.event.subjectLabel)
      .map(row=>[row.event.subjectId,row.event.subjectLabel!]));
    return NextResponse.json({
      ...result,
      actorNames,targetNames,
      // An absolute total is truthful only before the first keyset cursor.
      // Later pages must not relabel remaining rows as a full-history total.
      total:params.has("beforeOccurredAt")||params.has("beforeId")
        ? null : result.items.length+result.remainingCount,
      hasMore:result.nextCursor!==null,
      nextCursor:
        result.nextCursor
          ? {
              beforeOccurredAt:
                result.nextCursor.beforeOccurredAt.toISOString(),
              beforeId:
                result.nextCursor.beforeId,
            }
          : null,
    },{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
