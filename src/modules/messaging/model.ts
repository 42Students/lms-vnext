import { z } from "zod";

export const outboundChannelSchema = z.enum(["EMAIL", "SMS"]);
export const outboundStatusSchema = z.enum(["QUEUED", "SENT", "FAILED", "SUPPRESSED"]);
export const outboundSendSchema = z.strictObject({
  channel: outboundChannelSchema,
  recipient: z.string().trim().min(1).max(320),
  templateKey: z.string().trim().min(1).max(160).regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/),
  variables: z.record(z.string(), z.string().max(10000)).superRefine((values, ctx) => {
    const entries = Object.entries(values);
    if (entries.length > 25 || entries.some(([key]) => !/^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(key)) ||
        entries.reduce((size, [key, value]) => size + key.length + value.length, 0) > 12000) {
      ctx.addIssue({ code: "custom", message: "INVALID_TEMPLATE_VARIABLES" });
    }
  }),
  purpose: z.string().trim().min(1).max(160)
    .refine(value=>!/[\x00-\x1f\x7f]/.test(value),{message:"Invalid outbound purpose"}),
}).superRefine((value,ctx)=>{
  // Legacy 10k bodies are allowed only for verified TPO recruiter campaign emails.
  // Other templates, channels and merge variables retain the 4k bound.
  for(const [key,text] of Object.entries(value.variables)){
    if(text.length>4000 && !(key==="body" && value.channel==="EMAIL" &&
       value.purpose.startsWith("tpo-recruiter-campaign:"))){
      ctx.addIssue({code:"custom",path:["variables",key],message:"VARIABLE_TOO_LONG"});
    }
  }
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
  // Invisible format/BiDi controls are not valid mailbox characters and can
 // spoof recipient comparisons or displayed contact addresses.
 if(recipient.length>254||/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u.test(recipient))return false;
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
  // Validate every address and template before performing any policy lookups.
  const prepared=requests.map(request=>outboundSendSchema.parse(request));
  const seen=new Set<string>();
  return prepared.map(request=>{
    const recipient=normalizeRecipient(request.channel,request.recipient);
    const key=JSON.stringify([request.channel,recipient,request.purpose,request.templateKey]);
    const duplicate=seen.has(key);
    seen.add(key);
    const decision=duplicate?{status:"SUPPRESSED" as const,reason:"duplicate-in-batch" as const}:decideDelivery(request,policyFor(request));
    return {channel:request.channel,recipient,...decision};
  });
}

/** Exact Exotel job-update name normalization: DLT placeholders in a
 * recruiter-provided display name must never be interpolated as template text. */
export function sanitizeLegacyDltRecipientName(value:string|null|undefined):string{
 const cleaned=(value??"").trim().replace(/\{#[^}]*#\}/g,"").trim();
 return (cleaned||"User").slice(0,30);
}
/** A preview must use the college's live suppression set, not another
 * tenant's unsubscribes or a stale client-provided allowlist. */
export async function previewCollegeCampaignAudience(args:{
 collegeId:string;requests:readonly OutboundSendRequest[];
 loadSuppressed:(collegeId:string)=>Promise<ReadonlySet<string>>;
 policyFor:(request:OutboundSendRequest)=>DeliveryPolicy;
}){
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(args.collegeId))throw new Error("INVALID_COLLEGE_SCOPE");
 const requests=args.requests.map(request=>outboundSendSchema.parse(request));
 if(requests.some(request=>request.channel!=="EMAIL"||
    !request.purpose.startsWith("tpo-recruiter-campaign:")))
  throw new Error("INVALID_CAMPAIGN_PURPOSE");
 const suppressed=await args.loadSuppressed(args.collegeId);
 return previewAudience(requests,request=>({
  ...args.policyFor(request),
  suppressed:new Set([...args.policyFor(request).suppressed,...suppressed]),
 }));
}
export function suppressionOperatorMessage(reason:SuppressionReason):string{
 if(reason==="nonprod-not-allowlisted")
  return "Failed to send in development: recipient is outside the allowlist (not attempted).";
 if(reason==="unsubscribed")return "Unsubscribed for this college; not sent.";
 return "Not sent: "+reason.replace(/-/g," ")+".";
}
