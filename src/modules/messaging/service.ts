import { canContactRecipientAtRuntime } from "./runtime-safety";
import { opaqueBatchAttemptKey } from "./batch-dedupe";
import { decideDelivery, normalizeRecipient, outboundSendSchema, type DeliveryPolicy, type OutboundSendRequest, type OutboundStatus } from "./model";

export interface OutboundProvider {
  send(request: OutboundSendRequest): Promise<boolean>;
}
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
  auditBatch(batchId: string, summary: { sent: number; failed: number; suppressed: number }): Promise<void>;
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
      Math.max(policy.sentToday,startingDailySent+acceptedInBatch)>=policy.dailyCap
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
          record.status = await args.provider.send({ ...request, recipient: normalizeRecipient(request.channel, request.recipient) }) ? "SENT" : "FAILED";
        } catch {
          record.status = "FAILED";
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
