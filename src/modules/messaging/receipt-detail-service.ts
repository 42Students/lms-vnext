import "server-only";
import {and,desc,eq,lt,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {messagingDeliveryBatches,messagingDeliveryReceipts,messagingSmsDeliveryAttempts} from "@/db/schema/messaging-receipts";
import {hasMembershipRole,isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {logInfo} from "@/observability/logger";

/** Aggregates ONLY, never receipt recipient_key, addresses, or template variables. */
export async function getTpoMessagingBatch(context:RequestContext,rawId:unknown){
 const batchId=z.string().uuid().parse(rawId);
 const own=context.membership;
 if(!own||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,own.collegeId);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
    organizationId:college.organizationId,collegeId:college.id,
  });
  const [batch]=await tx.select({
   id:messagingDeliveryBatches.id,purpose:messagingDeliveryBatches.purpose,
   total:messagingDeliveryBatches.total,queued:messagingDeliveryBatches.queued,
   sent:messagingDeliveryBatches.sent,failed:messagingDeliveryBatches.failed,
   suppressed:messagingDeliveryBatches.suppressed,
   createdAt:messagingDeliveryBatches.createdAt,finalizedAt:messagingDeliveryBatches.finalizedAt,
  }).from(messagingDeliveryBatches).where(and(
   eq(messagingDeliveryBatches.id,batchId),eq(messagingDeliveryBatches.collegeId,college.id),
   eq(messagingDeliveryBatches.organizationId,college.organizationId)
  )).limit(1);
  if(!batch)return null;
  const [totals]=await tx.select({
   receipts:sql<number>`count(*)::integer`,
   queued:sql<number>`count(*) filter (where ${messagingDeliveryReceipts.status} = 'QUEUED')::integer`,
   sent:sql<number>`count(*) filter (where ${messagingDeliveryReceipts.status} = 'SENT')::integer`,
   failed:sql<number>`count(*) filter (where ${messagingDeliveryReceipts.status} = 'FAILED')::integer`,
   suppressed:sql<number>`count(*) filter (where ${messagingDeliveryReceipts.status} = 'SUPPRESSED')::integer`,
  }).from(messagingDeliveryReceipts).where(eq(messagingDeliveryReceipts.batchId,batch.id));
  return {...batch,actualReceipts:Number(totals?.receipts??0),
   actualQueued:Number(totals?.queued??0),actualSent:Number(totals?.sent??0),
   actualFailed:Number(totals?.failed??0),actualSuppressed:Number(totals?.suppressed??0)};
 });
}

/** Globally authorized support view of provider SMS attempts. This is not
 * a TPO read: an active, unscoped Super Admin system role is required and
 * rechecked against persisted roles before querying. No phone, recipient
 * HMAC/key, provider payload, token or message body leaves this service. */
export async function listSuperAdminSmsDeliveryAttempts(context:RequestContext,raw:unknown={}){
 if(!isSuperAdmin(context)||context.adminScope?.collegeId||context.adminScope?.organizationId)
  throw new AuthorizationError("activity.read");
 const input=z.strictObject({
  collegeId:z.string().uuid().optional(),
  before:z.iso.datetime({offset:true}).optional(),
  limit:z.number().int().min(1).max(50).default(25),
 }).parse(raw);
 const rows=await getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"activity.read");
  return tx.select({
   id:messagingSmsDeliveryAttempts.id,
   collegeId:messagingSmsDeliveryAttempts.collegeId,
   organizationId:messagingSmsDeliveryAttempts.organizationId,
   purpose:messagingSmsDeliveryAttempts.purpose,
   templateKey:messagingSmsDeliveryAttempts.templateKey,
   outcome:messagingSmsDeliveryAttempts.outcome,
   errorCode:messagingSmsDeliveryAttempts.errorCode,
   attemptedAt:messagingSmsDeliveryAttempts.attemptedAt,
  }).from(messagingSmsDeliveryAttempts)
   .where(and(
    input.collegeId?eq(messagingSmsDeliveryAttempts.collegeId,input.collegeId):undefined,
    input.before?lt(messagingSmsDeliveryAttempts.attemptedAt,new Date(input.before)):undefined,
   ))
   .orderBy(desc(messagingSmsDeliveryAttempts.attemptedAt),desc(messagingSmsDeliveryAttempts.id))
   .limit(input.limit);
 });
 // Operational access audit: IDs are not PII and the log has a request ID.
 logInfo("messaging.support.sms_attempts_viewed",{
  actorUserId:context.user.id,collegeId:input.collegeId??null,
  count:rows.length,limitedTo:input.limit,
 });
 return rows;
}
