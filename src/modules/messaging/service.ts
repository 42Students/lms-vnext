import { decideDelivery, normalizeRecipient, outboundSendSchema, type DeliveryPolicy, type OutboundSendRequest, type OutboundStatus } from "./model";

export interface OutboundProvider {
  send(request: OutboundSendRequest): Promise<boolean>;
}
export type DeliveryRecord = {
  batchId: string;
  channel: OutboundSendRequest["channel"];
  recipient: string;
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
}): Promise<DeliveryRecord[]> {
  const records: DeliveryRecord[] = [];
  for (const raw of args.requests) {
    const request = outboundSendSchema.parse(raw);
    const decision = decideDelivery(request, await args.policyFor(request));
    const record: DeliveryRecord = {
      batchId: args.batchId,
      channel: request.channel,
      recipient: normalizeRecipient(request.channel, request.recipient),
      templateKey: request.templateKey,
      purpose: request.purpose,
      status: decision.status,
      reason: decision.status === "SUPPRESSED" ? decision.reason : null,
    };
    // Persist suppression or queue BEFORE contacting an external provider.
    await args.repository.insert(record);
    if (record.status === "QUEUED") {
      try {
        record.status = await args.provider.send({ ...request, recipient: record.recipient }) ? "SENT" : "FAILED";
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
