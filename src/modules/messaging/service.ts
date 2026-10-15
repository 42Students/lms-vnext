import { canContactRecipientAtRuntime } from "./runtime-safety";
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
  const records: DeliveryRecord[] = [];
  for (const raw of args.requests) {
    const request = outboundSendSchema.parse(raw);
    const policy = await args.policyFor(request);
    const initial = decideDelivery(request, policy);
    // Enforce the independently configured AUTH test allowlist even if a caller
    // accidentally builds a permissive DeliveryPolicy object.
    const decision = canContactRecipientAtRuntime(
      request.channel, request.recipient, args.runtimeEnv ?? process.env,
    ) ? initial : {status:"SUPPRESSED" as const, reason:"nonprod-not-allowlisted" as const};
    const recipientKey = await args.recipientKeyFor(request);
    if (!/^[0-9a-f]{64}$/.test(recipientKey)) throw new Error("INVALID_RECIPIENT_KEY");
    const record: DeliveryRecord = {
      batchId: args.batchId,
      channel: request.channel,
      recipientKey,
      templateKey: request.templateKey,
      purpose: request.purpose,
      status: decision.status,
      reason: decision.status === "SUPPRESSED" ? decision.reason : null,
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
