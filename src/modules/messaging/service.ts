import { canContactRecipientAtRuntime } from "./runtime-safety";
import { opaqueBatchAttemptKey } from "./batch-dedupe";
import { decideDelivery, normalizeRecipient, outboundSendSchema, type DeliveryPolicy, type OutboundSendRequest, type OutboundStatus } from "./model";

export type ProviderAcceptance =
  | boolean
  | { status: "ACCEPTED" | "NOT_CONFIGURED" | "FAILED" };
export interface OutboundProvider {
  // ACCEPTED is transport acknowledgement, not guaranteed inbox delivery.
  send(request: OutboundSendRequest): Promise<ProviderAcceptance>;
}
export type OperatorDeliveryOutcome = "SENT" | "NOT_CONFIGURED" | "SUPPRESSED" | "FAILED" | "QUEUED";

/** Legacy SMS log lives in the restricted append-only sms_delivery_attempts
 * ledger (see listSmsDeliveryAttemptsForSupport in notifications/exotel-sms).
 * A general campaign repository cannot expose recipient phone numbers.
 * Its privileged, persistently-authorized support reader accepts this shape
 * and orders by created_at DESC,id DESC with a bounded 200-row page. */
export type PrivilegedSmsAttemptSearch={
 suffix?:string;purpose?:"otp"|"job.update"|"notification"|
   "attendance.absence"|"attendance.correction";
 outcome?:"PROVIDER_ACCEPTED"|"FAILED";
 page:number;size:number;
};
export type SafeSmsAttempt={
 id:string;purpose:string;provider:"EXOTEL"|string;
 recipientSuffix:string|null;createdAt:string;
 outcome:"PROVIDER_ACCEPTED"|"FAILED";
 providerMessageId:string|null;safeFailureCode:string|null;
};
export function normalizeSmsSupportFilter(input:{
 suffix?:string;purpose?:string;outcome?:string;page?:number;size?:number;
}):PrivilegedSmsAttemptSearch{
 const suffix=input.suffix?.replace(/[^0-9]/g,"").slice(-4);
 const purpose=input.purpose;
 const allowedPurposes=["otp","job.update","notification",
  "attendance.absence","attendance.correction"];
 if(purpose!==undefined&&!allowedPurposes.includes(purpose))
  throw new Error("INVALID_SMS_SUPPORT_PURPOSE");
 if(input.outcome!==undefined && input.outcome!=="PROVIDER_ACCEPTED" &&
    input.outcome!=="FAILED")throw new Error("INVALID_SMS_SUPPORT_OUTCOME");
 const page=input.page??1,size=input.size??50;
 if(!Number.isSafeInteger(page)||page<1||page>100000||
    !Number.isSafeInteger(size)||size<1||size>200)
  throw new Error("INVALID_SMS_SUPPORT_PAGE");
 return {page,size,...(suffix?{suffix}:{}),
  ...(purpose?{purpose:purpose as PrivilegedSmsAttemptSearch["purpose"]}:{}),
  ...(input.outcome?{outcome:input.outcome as PrivilegedSmsAttemptSearch["outcome"]}:{})};
}

export function operatorDeliveryOutcome(record: Pick<DeliveryRecord,"status"|"reason">):
  {status:OperatorDeliveryOutcome;message:string} {
  if(record.status==="SENT")return {status:"SENT",message:"Accepted by the delivery provider"};
  if(record.status==="QUEUED")return {status:"QUEUED",message:"Queued; delivery not confirmed"};
  if(record.status==="SUPPRESSED")return {status:"SUPPRESSED",
    message:record.reason==="nonprod-not-allowlisted"?
      "Not attempted: recipient outside development allowlist":"Not attempted: "+(record.reason??"delivery policy")};
  if(record.reason==="provider-not-configured")
    return {status:"NOT_CONFIGURED",message:"Delivery provider or template is not configured"};
  return {status:"FAILED",message:"Failed to send; review the delivery receipt"};
}
/** Fan-out cannot be inferred from an EMAIL or SMS transport receipt.
 * Dispatchers route app notifications independently from external channels.
 * The TRAI job-update lane requires its registered Exotel/DLT template.
 */
export const LEGACY_NOTIFICATION_CHANNEL_MATRIX = {
  JOB_UPDATE: ["IN_APP","EMAIL","TRAI_SMS"],
  // Legacy NotificationEventRegistry sends course events in-app only (email
  // to learners was narrowed to urgent interview/system events on 13 Oct 2026).
  COURSE_EVENT: ["IN_APP"],
  IN_APP_ONLY: ["IN_APP"],
} as const;

/** Per-event fan-out of the legacy NotificationDispatcherServiceImpl:105-171
 * driven by NotificationEventRegistry (sendInApp / sendEmail / sendSmsTrai /
 * pre-login email-only set) with the vNext producer that now owns each event.
 * External channels remain subject to consent, DLT/template approval and the
 * durable outbox; "IN_APP" is the in-transaction receipt. */
export const LEGACY_NOTIFICATION_EVENT_CHANNELS = {
  JOB_APPLICATION_CONFIRMATION: { channels: ["IN_APP", "TRAI_SMS"], vNext: "APPLICATION_STATUS_CHANGED (APPLIED)" },
  JOB_SHORTLISTED: { channels: ["IN_APP", "TRAI_SMS"], vNext: "APPLICATION_STATUS_CHANGED (SHORTLISTED)" },
  JOB_ASSESSMENT_INVITE: { channels: ["IN_APP"], vNext: "APPLICATION_STATUS_CHANGED (ASSESSMENT)" },
  JOB_INTERVIEW_SCHEDULED: { channels: ["IN_APP", "EMAIL", "TRAI_SMS"], vNext: "ROUND_SCHEDULED" },
  JOB_OFFER_EXTENDED: { channels: ["IN_APP"], vNext: "OFFER_RELEASED" },
  JOB_HIRED: { channels: ["IN_APP"], vNext: "APPLICATION_STATUS_CHANGED (HIRED)" },
  JOB_APPLICATION_REJECTED: { channels: ["IN_APP", "TRAI_SMS"], vNext: "APPLICATION_STATUS_CHANGED (REJECTED)" },
  JOB_WAITLISTED: { channels: ["IN_APP"], vNext: "APPLICATION_STATUS_CHANGED (WAITLISTED)" },
  INTERVIEW_REMINDER: { channels: ["IN_APP", "EMAIL", "TRAI_SMS"], vNext: "ROUND_REMINDER" },
  INTERVIEW_CONFIRMED: { channels: ["IN_APP", "EMAIL", "TRAI_SMS"], vNext: "ROUND_SCHEDULED (slot booked)" },
  INTERVIEW_CANCELLED: { channels: ["IN_APP"], vNext: "college stage move away from Interview" },
  INTERVIEW_RESCHEDULED: { channels: ["IN_APP"], vNext: "RESCHEDULE_DECIDED" },
  COURSE_ASSIGNMENT_DUE: { channels: ["IN_APP"], vNext: "notification.assignmentReminders scheduler" },
  COURSE_ASSIGNMENT_SUBMITTED: { channels: ["IN_APP"], vNext: "assignment submission event" },
  COURSE_GRADE_PUBLISHED: { channels: ["IN_APP"], vNext: "grade release event" },
  SYSTEM_EMAIL_VERIFICATION: { channels: ["EMAIL"], vNext: "pre-login email (no in-app)" },
  SYSTEM_APPLICATION_APPROVED: { channels: ["EMAIL"], vNext: "pre-login email (no in-app)" },
  SYSTEM_APPLICATION_REJECTED: { channels: ["EMAIL"], vNext: "pre-login email (no in-app)" },
  SYSTEM_OTP_SMS: { channels: ["OTP_SMS"], vNext: "auth OTP delivery" },
} as const;
export type DeliveryRecord = {
  batchId: string;
  channel: OutboundSendRequest["channel"];
  /** Opaque keyed recipient reference; never store an address or phone. */
  recipientKey: string;
  templateKey: string;
  purpose: string;
  status: OutboundStatus;
  reason: string | null;
};
export interface DeliveryRepository {
  insert(record: DeliveryRecord): Promise<void>;
  update(record: DeliveryRecord): Promise<void>;
  /** Stores only delivery status, not the complete address or provider body.
   * Campaign recipients/event notification receipts keep their own tenant-
   * scoped records. This aggregate is a dashboard count, not inbox delivery. */
  auditBatch(batchId: string, summary: { sent: number; failed: number; suppressed: number }): Promise<void>;
}
export type DeliveryBatchRollup={
 acceptedByProvider:number;failed:number;suppressed:number;unresolved:number;
 status:"COMPLETED"|"RECONCILIATION_REQUIRED";
};
export function summarizeDeliveryBatch(records:readonly DeliveryRecord[]):DeliveryBatchRollup{
 const acceptedByProvider=records.filter(item=>item.status==="SENT").length;
 const failed=records.filter(item=>item.status==="FAILED").length;
 const suppressed=records.filter(item=>item.status==="SUPPRESSED").length;
 const unresolved=records.filter(item=>item.status==="QUEUED").length;
 return {acceptedByProvider,failed,suppressed,unresolved,
  status:unresolved?"RECONCILIATION_REQUIRED":"COMPLETED"};
}
export type TenantTransactionalSendInput={
 batchId:string;request:OutboundSendRequest;
 provider:OutboundProvider;repository:DeliveryRepository;
 policyFor:(request:OutboundSendRequest)=>Promise<DeliveryPolicy>;
 recipientKeyFor:(request:OutboundSendRequest)=>Promise<string>;
 runtimeEnv?:Record<string,string|undefined>;
};
/** The old sendAsCollege facade completed one recipient at a time. Keep its
 * per-recipient result while requiring the exact same tenant-specific sender
 * template, opaque recipient key, policy and repository as batch dispatch.
 * The typed result is provider acceptance, not handset/inbox delivery. */
export async function sendTenantTransactionalMessage(
 input:TenantTransactionalSendInput,
):Promise<{record:DeliveryRecord;outcome:ReturnType<typeof operatorDeliveryOutcome>}>{
 const [record]=await deliverBatch({...input,requests:[input.request]});
 if(!record)throw new Error("EMPTY_TRANSACTIONAL_DELIVERY");
 return {record,outcome:operatorDeliveryOutcome(record)};
}
/** A safe opaque identifier must be supplied for every auditable delivery batch. */
export function validOutboundBatchId(value:string):boolean {
 return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(value);
}
export async function deliverBatch(args: {
  batchId: string;
  requests: readonly OutboundSendRequest[];
  provider: OutboundProvider;
  repository: DeliveryRepository;
  policyFor: (request: OutboundSendRequest) => Promise<DeliveryPolicy>;
  recipientKeyFor: (request: OutboundSendRequest) => Promise<string>;
  runtimeEnv?: Record<string, string | undefined>;
}): Promise<DeliveryRecord[]> {
  if(!validOutboundBatchId(args.batchId))throw new Error("INVALID_OUTBOUND_BATCH_ID");
  if (args.requests.length > 500) throw new Error("OUTBOUND_BATCH_CAP_EXCEEDED");
  // Validate the entire batch before the first persistence or external send.
  const requests = args.requests.map(raw => outboundSendSchema.parse(raw));
  const keyedRequests = await Promise.all(requests.map(async request => ({
    request,recipientKey:await args.recipientKeyFor(request),
  })));
  if(keyedRequests.some(item=>!/^[0-9a-f]{64}$/.test(item.recipientKey)))
    throw new Error("INVALID_RECIPIENT_KEY");
  const records: DeliveryRecord[] = [];
  let startingDailySent:number|undefined;
  let acceptedInBatch=0;
  const recipientAccepted=new Map<string,{baseline:number;accepted:number}>();
  const seenRecipientPurpose = new Set<string>();
  for (const {request,recipientKey} of keyedRequests) {
    let policy: DeliveryPolicy;
    try {
      policy = await args.policyFor(request);
    } catch {
      // A transient policy read must fail this recipient closed rather than
      // leaving an already-sent partial batch without its final audit totals.
      const rejected: DeliveryRecord = {
        batchId: args.batchId, channel: request.channel, recipientKey,
        templateKey: request.templateKey, purpose: request.purpose,
        status: "FAILED", reason: "policy-read-failed",
      };
      await args.repository.insert(rejected);
      records.push({ ...rejected });
      continue;
    }
    startingDailySent ??= policy.sentToday;
    const initial = decideDelivery(request, policy);
    // Enforce the independently configured AUTH test allowlist even if a caller
    // accidentally builds a permissive DeliveryPolicy object.
    const decision = canContactRecipientAtRuntime(
      request.channel, request.recipient, args.runtimeEnv ?? process.env,
    ) ? initial : {status:"SUPPRESSED" as const, reason:"nonprod-not-allowlisted" as const};
    // Never dispatch the same keyed recipient twice for the same purpose in one batch.
    // Use only the opaque key, never contact details, in the deduplication set.
    const dedupeKey = opaqueBatchAttemptKey(request.channel,recipientKey,request.purpose,request.templateKey);
    const duplicate = seenRecipientPurpose.has(dedupeKey);
    seenRecipientPurpose.add(dedupeKey);
    const recipientWindowKey=request.channel+":"+recipientKey;
    const recipientCounter=recipientAccepted.get(recipientWindowKey)??{
      baseline:policy.recentRecipientSends,accepted:0,
    };
    recipientAccepted.set(recipientWindowKey,recipientCounter);
    const recipientWindowFull= Math.max(
      policy.recentRecipientSends,recipientCounter.baseline+recipientCounter.accepted,
    )>=policy.recipientWindowCap;
    const capacityDecision = decision.status==="QUEUED" && recipientWindowFull
      ? {status:"SUPPRESSED" as const,reason:"rate-limited" as const} :
      decision.status==="QUEUED" &&
      Math.max(policy.sentToday,(startingDailySent??policy.sentToday)+acceptedInBatch)>=policy.dailyCap
      ? {status:"SUPPRESSED" as const,reason:"daily-cap" as const}:decision;
    const finalDecision = duplicate
      ? {status: "SUPPRESSED" as const, reason: "duplicate-in-batch" as const}
      : capacityDecision;
    const record: DeliveryRecord = {
      batchId: args.batchId,
      channel: request.channel,
      recipientKey,
      templateKey: request.templateKey,
      purpose: request.purpose,
      status: finalDecision.status,
      reason: finalDecision.status === "SUPPRESSED" ? finalDecision.reason : null,
    };
    // Persist suppression or queue BEFORE contacting an external provider.
    await args.repository.insert(record);
    if (record.status === "QUEUED") {
      // The queue decision can become stale while persisted: an unsubscribe,
      // quota change or removed allowlist entry must stop dispatch.
      let refreshedPolicy: DeliveryPolicy | null = null;
      try {
        refreshedPolicy = await args.policyFor(request);
      } catch {
        record.status = "FAILED";
        record.reason = "policy-recheck-failed";
      }
      if(refreshedPolicy){
        const refreshed = decideDelivery(request,refreshedPolicy);
        if(refreshed.status==="SUPPRESSED"){
          record.status = "SUPPRESSED";
          record.reason = refreshed.reason;
        }else if(!canContactRecipientAtRuntime(
          request.channel,request.recipient,args.runtimeEnv ?? process.env,
        )){
          record.status = "SUPPRESSED";
          record.reason = "nonprod-not-allowlisted";
        }
      }
      if(record.status==="QUEUED"){
        try {
          const accepted = await args.provider.send({
            ...request, recipient: normalizeRecipient(request.channel, request.recipient),
          });
          const outcome = typeof accepted==="boolean"
            ? accepted?"ACCEPTED":"FAILED" : accepted.status;
          record.status = outcome==="ACCEPTED"?"SENT":"FAILED";
          record.reason = outcome==="NOT_CONFIGURED"?"provider-not-configured":
            outcome==="FAILED"?"provider-rejected":null;
        } catch {
          // A provider network timeout can happen after acceptance. Never
          // label an ambiguous attempt FAILED and automatically replay it.
          // The audit remains QUEUED until an operator checks the provider
          // receipt and explicitly reconciles this specific recipient.
          record.status = "QUEUED";
          record.reason = "provider-result-unknown";
        }
      }
      await args.repository.update(record);
      if(record.status==="SENT"){
        acceptedInBatch++;
        recipientCounter.accepted++;
      }
    }
    records.push({ ...record });
  }
  await args.repository.auditBatch(args.batchId, {
    sent: records.filter(record => record.status === "SENT").length,
    failed: records.filter(record => record.status === "FAILED").length,
    suppressed: records.filter(record => record.status === "SUPPRESSED").length,
  });
  return records;
}
