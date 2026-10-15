import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { messagingDeliveryBatches } from "@/db/schema/messaging-receipts";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { messagingHistoryQuerySchema, projectMessagingHistory } from "./receipt-history-model";

const PAGE_SIZE = 25;
/** Only a live college-scoped placement officer can read aggregate counts. */
export async function listTpoMessagingHistory(
  context: RequestContext, raw: unknown = {},
) {
  const collegeId = context.membership?.collegeId;
  if (!collegeId || !hasMembershipRole(context, "TPO"))
    throw new AuthorizationError("placements.manage");
  const college = await requirePlacementManageScope(context, collegeId);
  const query = messagingHistoryQuerySchema.parse(raw);
  const where = and(
    eq(messagingDeliveryBatches.collegeId, college.id),
    eq(messagingDeliveryBatches.organizationId, college.organizationId),
    ...(query.purpose ? [eq(messagingDeliveryBatches.purpose, query.purpose)] : []),
  );
  const db = getDb();
  const [counts, rows] = await Promise.all([
    db.select({ total: sql<number>`count(*)::integer` })
      .from(messagingDeliveryBatches).where(where),
    db.select({
      id: messagingDeliveryBatches.id,
      purpose: messagingDeliveryBatches.purpose,
      total: messagingDeliveryBatches.total,
      queued: messagingDeliveryBatches.queued,
      sent: messagingDeliveryBatches.sent,
      failed: messagingDeliveryBatches.failed,
      suppressed: messagingDeliveryBatches.suppressed,
      createdAt: messagingDeliveryBatches.createdAt,
      finalizedAt: messagingDeliveryBatches.finalizedAt,
    }).from(messagingDeliveryBatches)
      .where(where)
      .orderBy(desc(messagingDeliveryBatches.createdAt), desc(messagingDeliveryBatches.id))
      .limit(PAGE_SIZE).offset((query.page - 1) * PAGE_SIZE),
  ]);
  const total = Number(counts[0]?.total ?? 0);
  return { rows: projectMessagingHistory(rows), page: query.page, pageSize: PAGE_SIZE,
    total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
