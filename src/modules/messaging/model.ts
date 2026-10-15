import { z } from "zod";

export const outboundChannelSchema = z.enum(["EMAIL", "SMS"]);
export const outboundStatusSchema = z.enum(["QUEUED", "SENT", "FAILED", "SUPPRESSED"]);
export const outboundSendSchema = z.strictObject({
  channel: outboundChannelSchema,
  recipient: z.string().trim().min(1).max(320),
  templateKey: z.string().trim().min(1).max(160).regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/),
  variables: z.record(z.string(), z.string().max(4000)).superRefine((values, ctx) => {
    const entries = Object.entries(values);
    if (entries.length > 25 || entries.some(([key]) => !/^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(key)) ||
        entries.reduce((size, [key, value]) => size + key.length + value.length, 0) > 12000) {
      ctx.addIssue({ code: "custom", message: "INVALID_TEMPLATE_VARIABLES" });
    }
  }),
  purpose: z.string().trim().min(1).max(160)
    .refine(value=>!/[\x00-\x1f\x7f]/.test(value),{message:"Invalid outbound purpose"}),
});
export type OutboundSendRequest = z.infer<typeof outboundSendSchema>;
export type OutboundStatus = z.infer<typeof outboundStatusSchema>;
export type SuppressionReason = "nonprod-not-allowlisted" | "unsubscribed" | "rate-limited" | "daily-cap" | "invalid-recipient" | "duplicate-in-batch";
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
  if(channel === "SMS")return /^\+[1-9][0-9]{7,14}$/.test(recipient);
  if(recipient.length>254||/[\x00-\x1f\x7f]/.test(recipient))return false;
  const match=/^([^\s@]+)@([^\s@]+)$/.exec(recipient);
  if(!match)return false;
  const [,local,domain]=match;
  if(local.length>64||!local||local.startsWith(".")||local.endsWith(".")||
     local.includes("..")||domain.length>253||!domain.includes("."))return false;
  const labels=domain.split(".");
  return labels.every(label=>label.length>0&&label.length<=63&&
    !label.startsWith("-")&&!label.endsWith("-")&&/^[A-Za-z0-9-]+$/.test(label));
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
  // Malformed or overflowing counters must never disable rate-limit enforcement.
  if (!Number.isSafeInteger(policy.dailyCap) || policy.dailyCap <= 0 ||
      !Number.isSafeInteger(policy.sentToday) || policy.sentToday < 0 ||
      policy.sentToday >= policy.dailyCap) {
    return { status: "SUPPRESSED", reason: "daily-cap" };
  }
  if (!Number.isSafeInteger(policy.recipientWindowCap) || policy.recipientWindowCap <= 0 ||
      !Number.isSafeInteger(policy.recentRecipientSends) || policy.recentRecipientSends < 0 ||
      policy.recentRecipientSends >= policy.recipientWindowCap) {
    return { status: "SUPPRESSED", reason: "rate-limited" };
  }
  return { status: "QUEUED" };
}
export function previewAudience(requests: readonly OutboundSendRequest[], policyFor: (request: OutboundSendRequest) => DeliveryPolicy) {
  return requests.map(request => ({ channel: request.channel, recipient: normalizeRecipient(request.channel, request.recipient), ...decideDelivery(request, policyFor(request)) }));
}
