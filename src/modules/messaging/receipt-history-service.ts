import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { messagingDeliveryBatches } from "@/db/schema/messaging-receipts";
import { hasMembershipRole, isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { messagingHistoryQuerySchema, projectMessagingHistory, legacyMessagingHistoryPaging } from "./receipt-history-model";
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
/** Legacy AdminSmsLogController compatibility. The URL accepts no phone:
 * this callable is reached through same-origin POST, and only last-four
 * digits reach the append-only Exotel ledger query.
 *
 * The underlying provider adapter uses 1-based pages. Translate its cursor
 * and response back to legacy zero-based "number", 50 default/200 max.
 */
export async function listSupportSmsDeliveryHistory(
 context:RequestContext,
 raw:{recipientSuffix?:unknown;purpose?:unknown;page?:unknown;size?:unknown}={},
){
 if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE"||
    context.adminScope?.collegeId||context.adminScope?.organizationId)
  throw new AuthorizationError("admin-scope.select");
 requirePermission(context,"admin-scope.select");
 const {listSmsDeliveryAttemptsForSupport}=await import("@/modules/notifications/exotel-sms");
 const suffix=typeof raw.recipientSuffix==="string"
  ?raw.recipientSuffix.replace(/[^0-9]/g,"").slice(-4):"";
 if(raw.recipientSuffix!==undefined&&raw.recipientSuffix!==null&&suffix.length<4)
  throw new Error("Enter at least four digits for the recipient suffix");
 const {page,size}=legacyMessagingHistoryPaging(raw.page,raw.size);
 try{
  const result=await listSmsDeliveryAttemptsForSupport(context,{
   suffix:suffix||undefined,purpose:raw.purpose,
   page:page+1,size,
  });
  const content=result.content.map(row=>({
   id:row.id,purpose:row.purpose,
   recipientSuffix:row.recipientSuffix,
   status:row.outcome==="PROVIDER_ACCEPTED"?"SENT" as const:"FAILED" as const,
   providerMessageId:row.providerMessageId,
   errorSummary:row.failureSummary,
   collegeId:row.collegeId,
   createdAt:row.createdAt,
   provider:row.provider,
   providerStatus:row.statusLabel,
  }));
  return {
   ready:result.ready,content,entries:content,
   totalElements:result.totalElements,totalPages:result.totalPages,
   number:page,page,size,
   error:result.readError,
   retryable:!result.ready,
   note:result.note,
  };
 }catch(error){
  // Authentication/authorization failures MUST bubble up rather than be
  // silently turned into a zero-entry response.
  if(error instanceof AuthorizationError)throw error;
  return {
   ready:false,content:[],entries:[],totalElements:0,totalPages:0,
   number:page,page,size,error:"SMS_LEDGER_UNAVAILABLE",
   retryable:true,note:"SMS history cannot be loaded. Retry later.",
  };
 }
}
