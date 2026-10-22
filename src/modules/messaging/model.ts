import { z } from "zod";

export const outboundChannelSchema = z.enum(["EMAIL", "SMS"]);
export const outboundStatusSchema = z.enum(["QUEUED", "SENT", "FAILED", "SUPPRESSED"]);
export const outboundSendSchema = z.strictObject({
  channel: outboundChannelSchema,
  recipient: z.string().trim().min(1).max(320),
  templateKey: z.string().trim().min(1).max(160).regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/),
  variables: z.record(z.string(), z.string().max(10000)).superRefine((values, ctx) => {
    const entries = Object.entries(values);
    const reserved = /^(?:__proto__|constructor|prototype|password|otp|apiKey|accessToken|secret)$/i;
    if (entries.length > 25) {
      ctx.addIssue({ code: "custom", message: "TEMPLATE_VARIABLE_COUNT_EXCEEDED" });
    }
    for (const [key, value] of entries) {
      if (!/^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(key) || reserved.test(key)) {
        ctx.addIssue({ code: "custom", path: [key], message: "INVALID_TEMPLATE_KEY" });
      }
      if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
        ctx.addIssue({ code: "custom", path: [key], message: "INVALID_TEMPLATE_VALUE" });
      }
    }
    if (entries.reduce((size, [key, value]) => size + key.length + value.length, 0) > 12000) {
      ctx.addIssue({ code: "custom", message: "TEMPLATE_VARIABLE_BUDGET_EXCEEDED" });
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
/** Canonicalize legacy Indian local, 91-prefixed, and international numbers
 * before allowlisting, deduplication, policy checks, and provider delivery.
 * Do not guess a country for a number of a different length. */
export function normalizeSmsRecipient(input: string): string {
  const compact = input.trim().replace(/[\s().-]/g, "");
  if (/^[6-9][0-9]{9}$/.test(compact)) return "+91" + compact;
  if (/^91[6-9][0-9]{9}$/.test(compact)) return "+" + compact;
  if (/^0091[6-9][0-9]{9}$/.test(compact)) return "+" + compact.slice(2);
  if (/^00[1-9][0-9]{7,14}$/.test(compact)) return "+" + compact.slice(2);
  return compact;
}
export function normalizeRecipient(channel: "EMAIL" | "SMS", recipient: string): string {
  return channel === "EMAIL" ? recipient.trim().toLowerCase() : normalizeSmsRecipient(recipient);
}
export function isValidRecipient(channel: "EMAIL" | "SMS", recipient: string): boolean {
  if(channel === "SMS")return /^\+[1-9][0-9]{7,14}$/.test(normalizeSmsRecipient(recipient));
  // Invisible format/BiDi controls are not valid mailbox characters and can
 // spoof recipient comparisons or displayed contact addresses.
 if(recipient.length>254||/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u.test(recipient))return false;
  const match=/^([^\s@]+)@([^\s@]+)$/.exec(recipient);
  if(!match)return false;
  const [,local,domain]=match;
  if(!local||!domain||local.length>64||local.startsWith(".")||local.endsWith(".")||
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
 const cleaned=(value??"").replace(/\{#.*?#\}/g,"")
  .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]+/gu," ")
  .replace(/\s+/gu," ").trim();
 return Array.from(cleaned||"User").slice(0,30).join("").trim()||"User";
}

/** Legacy NotificationDispatcher truncated only overlong merge *values* at
 * 8192 characters (not the whole rendered message). Modern generic outbound
 * variables remain stricter; only a trusted event assembler uses this adapter. */
export function legacyEventMergeValue(value: string): string {
 return value.length>8192?value.slice(0,8189)+"...":value;
}

/** Actionable template diagnostics never expose merge values, credentials,
 * recipient addresses, or an untrusted provider response body. */
export function requiredTemplateVariableDiagnostics(
 variables:Readonly<Record<string,string>>,
 requiredKeys:readonly string[],
):readonly {code:"REQUIRED_TEMPLATE_VARIABLE_MISSING";key:string}[]{
 return requiredKeys.filter(key=>
  /^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(key)&&
  !/^(?:password|otp|apiKey|accessToken|secret)$/i.test(key)&&
  !variables[key]?.trim()
 ).map(key=>({code:"REQUIRED_TEMPLATE_VARIABLE_MISSING" as const,key}));
}

/** Never apply outbound recipient validation to the admin SMS-log search.
 * A pasted international number filters on its last four digits only. */
export function normalizeSmsSupportSearch(input:string|null|undefined):string{
 return (input??"").replace(/[^0-9]/g,"").slice(-4);
}

/** Registered template/sender defaults belong to the tenant's trusted
 * provider registry; this adapter maps legacy invocations into the scoped
 * vNext transport model without accepting arbitrary From/Reply-To headers. */
export function legacyTpoOutboundRequest(input:{
 recipient:string;templateKey:string;purpose:string;
 variables:Readonly<Record<string,string>>;
}):OutboundSendRequest{
 return outboundSendSchema.parse({
  channel:"EMAIL",recipient:input.recipient,templateKey:input.templateKey,
  variables:Object.fromEntries(Object.entries(input.variables).map(
   ([key,value])=>[key,legacyEventMergeValue(value)])),
  purpose:input.purpose,
 });
}

/** Only restricted, append-only provider audit stores an Exotel SID.
 * This is not part of an audience preview or an operator-facing delivery row. */
export type RestrictedProviderReceipt={
 channel:"SMS";provider:"EXOTEL";providerMessageId:string|null;
 accepted:boolean;failureCode:string|null;
};
export function restrictedExotelReceipt(input:{
 providerMessageId?:string|null;accepted:boolean;failureCode?:string|null;
}):RestrictedProviderReceipt{
 const sid=input.providerMessageId?.trim()||null;
 if(sid&&!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(sid))
  throw new Error("INVALID_PROVIDER_MESSAGE_ID");
 if(input.accepted!==Boolean(sid)||(!input.accepted&&!input.failureCode))
  throw new Error("INVALID_PROVIDER_RECEIPT");
 return {channel:"SMS",provider:"EXOTEL",providerMessageId:sid,
  accepted:input.accepted,failureCode:input.accepted?null:input.failureCode??null};
}
/** A preview must use the college's live suppression set, not another
 * tenant's unsubscribes or a stale client-provided allowlist. */
export async function previewCollegeCampaignAudience(args:{
 collegeId:string;requests:readonly OutboundSendRequest[];
 loadSuppressed:(collegeId:string)=>Promise<ReadonlySet<string>>;
 policyFor:(request:OutboundSendRequest)=>DeliveryPolicy;
}){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(args.collegeId))
  throw new Error("INVALID_COLLEGE_SCOPE");
 const requests=args.requests.map(request=>outboundSendSchema.parse(request));
 if(requests.some(request=>request.channel!=="EMAIL"||
    !request.purpose.startsWith("tpo-recruiter-campaign:")))
  throw new Error("INVALID_CAMPAIGN_PURPOSE");
 const suppressed=await args.loadSuppressed(args.collegeId);
 return previewAudience(requests,request=>{
  // Read each policy once: a live per-college unsubscribe snapshot must not
  // be mixed with two inconsistent caller policy reads in one preview row.
  const policy=args.policyFor(request);
  return {...policy,suppressed:new Set([...policy.suppressed,...suppressed])};
 });
}
export function suppressionOperatorMessage(reason:SuppressionReason):string{
 if(reason==="nonprod-not-allowlisted")
  return "Not attempted in development: recipient is outside the allowlist.";
 if(reason==="unsubscribed")return "Unsubscribed for this college; not sent.";
 return "Not sent: "+reason.replace(/-/g," ")+".";
}
