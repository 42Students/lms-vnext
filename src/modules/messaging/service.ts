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
export async function deliverBatch(args: {
  batchId: string;
  requests: readonly OutboundSendRequest[];
  provider: OutboundProvider;
  repository: DeliveryRepository;
  policyFor: (request: OutboundSendRequest) => Promise<DeliveryPolicy>;
  recipientKeyFor: (request: OutboundSendRequest) => Promise<string>;
  runtimeEnv?: Record<string, string | undefined>;
}): Promise<DeliveryRecord[]> {
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
    const policy = await args.policyFor(request);
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
      try {
        record.status = await args.provider.send({ ...request, recipient: normalizeRecipient(request.channel, request.recipient) }) ? "SENT" : "FAILED";
      } catch {
        record.status = "FAILED";
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
