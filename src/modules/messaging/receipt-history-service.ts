import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { messagingDeliveryBatches } from "@/db/schema/messaging-receipts";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { messagingHistoryQuerySchema, projectMessagingHistory } from "./receipt-history-model";
import {messagingHistoryPageWindow} from "./receipt-history-window-model";

const PAGE_SIZE = 25;
/** A bounded export preserves filtering and tenant checks instead of exporting a page. */
export async function exportTpoMessagingHistory(context:RequestContext,raw:unknown={}){
 const collegeId=context.membership?.collegeId;
 if(!collegeId||!hasMembershipRole(context,"TPO"))
   throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,collegeId);
 const query=messagingHistoryQuerySchema.parse(raw);
 const where=and(
   eq(messagingDeliveryBatches.collegeId,college.id),
   eq(messagingDeliveryBatches.organizationId,college.organizationId),
   ...(query.purpose?[eq(messagingDeliveryBatches.purpose,query.purpose)]:[]),
 );
 return getDb().transaction(async tx=>{
   await assertPersistedPlatformPermission(tx,context,"placements.manage",{
     organizationId:college.organizationId,collegeId:college.id,
   });
   const rows=await tx.select({
     id:messagingDeliveryBatches.id,purpose:messagingDeliveryBatches.purpose,
     total:messagingDeliveryBatches.total,queued:messagingDeliveryBatches.queued,
     sent:messagingDeliveryBatches.sent,failed:messagingDeliveryBatches.failed,
     suppressed:messagingDeliveryBatches.suppressed,
     createdAt:messagingDeliveryBatches.createdAt,finalizedAt:messagingDeliveryBatches.finalizedAt,
   }).from(messagingDeliveryBatches).where(where)
     .orderBy(desc(messagingDeliveryBatches.createdAt),desc(messagingDeliveryBatches.id))
     .limit(2001);
   if(rows.length>2000)throw new Error("CAMPAIGN_EXPORT_TOO_LARGE");
   return projectMessagingHistory(rows);
 });
}

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
  return db.transaction(async tx => {
    await assertPersistedPlatformPermission(tx, context, "placements.manage", {
      organizationId: college.organizationId, collegeId: college.id,
    });
    const [count] = await tx.select({total:sql<number>`count(*)::integer`})
      .from(messagingDeliveryBatches).where(where);
    const total = Number(count?.total ?? 0);
    const window = messagingHistoryPageWindow(query.page,total,PAGE_SIZE);
    const rows = await tx.select({
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
      .orderBy(desc(messagingDeliveryBatches.createdAt),desc(messagingDeliveryBatches.id))
      .limit(PAGE_SIZE).offset(window.offset);
    return { rows: projectMessagingHistory(rows), page: window.page, pageSize: PAGE_SIZE,
      total, pages: window.pages };
  });
}

/** Cross-channel help-desk audit, unlike the college-only TPO batch history.
 * The implementation requires an active GLOBAL Super Admin and deliberately
 * projects only a last-four suffix, never the submitted phone or message body.
 */
export async function listSupportSmsDeliveryHistory(
 context:RequestContext,
 raw:{recipientSuffix?:unknown;purpose?:unknown;page?:unknown;size?:unknown}={},
){
 const {listSmsDeliveryAttemptsForSupport}=await import("@/modules/notifications/exotel-sms");
 const digits=typeof raw.recipientSuffix==="string"
  ?raw.recipientSuffix.replace(/[^0-9]/g,""):"";
 if(raw.recipientSuffix!==undefined&&digits.length<4)
  throw new Error("Enter at least four digits for the recipient suffix");
 return listSmsDeliveryAttemptsForSupport(context,{
  suffix:digits?digits.slice(-4):undefined,
  purpose:raw.purpose,
  page:typeof raw.page==="number"?raw.page:1,
  size:typeof raw.size==="number"?raw.size:25,
 });
}
