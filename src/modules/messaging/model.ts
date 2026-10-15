import { z } from "zod";

export const outboundChannelSchema = z.enum(["EMAIL", "SMS"]);
export const outboundStatusSchema = z.enum(["QUEUED", "SENT", "FAILED", "SUPPRESSED"]);
export const outboundSendSchema = z.object({
  channel: outboundChannelSchema,
  recipient: z.string().trim().min(1).max(320),
  templateKey: z.string().trim().min(1).max(160),
  variables: z.record(z.string(), z.string().max(4000)),
  purpose: z.string().trim().min(1).max(160),
});
export type OutboundSendRequest = z.infer<typeof outboundSendSchema>;
export type OutboundStatus = z.infer<typeof outboundStatusSchema>;
export type SuppressionReason = "nonprod-not-allowlisted" | "unsubscribed" | "rate-limited" | "daily-cap" | "invalid-recipient";
export type OutboundDecision = { status: "QUEUED" } | { status: "SUPPRESSED"; reason: SuppressionReason };
export type DeliveryPolicy = {
  appEnv: string | undefined;
  testEmails: readonly string[];
  testPhones: readonly string[];
  suppressed: ReadonlySet<string>;
  sentToday: number;
  dailyCap: number;
  recentRecipientSends: number;
  recipientWindowCap: number;
};
export function normalizeRecipient(channel: "EMAIL" | "SMS", recipient: string): string {
  return channel === "EMAIL" ? recipient.trim().toLowerCase() : recipient.trim();
}
export function isValidRecipient(channel: "EMAIL" | "SMS", recipient: string): boolean {
  return channel === "EMAIL"
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)
    : /^\+[1-9][0-9]{7,14}$/.test(recipient);
}
export function decideDelivery(request: OutboundSendRequest, policy: DeliveryPolicy): OutboundDecision {
  const recipient = normalizeRecipient(request.channel, request.recipient);
  if (!isValidRecipient(request.channel, recipient)) return { status: "SUPPRESSED", reason: "invalid-recipient" };
  if (policy.appEnv !== "production") {
    const allowed = request.channel === "EMAIL"
      ? policy.testEmails.some(value => normalizeRecipient("EMAIL", value) === recipient)
      : policy.testPhones.some(value => normalizeRecipient("SMS", value) === recipient);
    if (!allowed) return { status: "SUPPRESSED", reason: "nonprod-not-allowlisted" };
  }
  if (policy.suppressed.has(`${request.channel}:${recipient}`)) return { status: "SUPPRESSED", reason: "unsubscribed" };
  if (policy.dailyCap <= 0 || policy.sentToday >= policy.dailyCap) return { status: "SUPPRESSED", reason: "daily-cap" };
  if (policy.recipientWindowCap <= 0 || policy.recentRecipientSends >= policy.recipientWindowCap) return { status: "SUPPRESSED", reason: "rate-limited" };
  return { status: "QUEUED" };
}
export function previewAudience(requests: readonly OutboundSendRequest[], policyFor: (request: OutboundSendRequest) => DeliveryPolicy) {
  return requests.map(request => ({ channel: request.channel, recipient: normalizeRecipient(request.channel, request.recipient), ...decideDelivery(request, policyFor(request)) }));
}
