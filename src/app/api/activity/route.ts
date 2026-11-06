import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { hasAmbiguousQuerySelectors } from "@/lib/security-query-selectors";
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

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const params = new URL(
      request.url,
    ).searchParams;
    if (hasAmbiguousQuerySelectors(params, [
      "collegeId", "organizationId", "module", "importance", "actorUserId",
      "actorId", "eventType", "subjectType", "targetType", "from",
      "startDate", "to", "endDate", "beforeOccurredAt", "beforeId", "limit",
    ], [
      ["actorUserId", "actorId"],
      ["subjectType", "targetType"],
      ["from", "startDate"],
      ["to", "endDate"],
    ], [
      "collegeId", "organizationId", "actorUserId", "actorId",
      "beforeOccurredAt", "beforeId", "limit",
    ])) return NextResponse.json({ error: "INVALID_ACTIVITY_QUERY" }, {
      status: 400, headers: { "Cache-Control": "private, no-store" },
    });
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
  },
);
