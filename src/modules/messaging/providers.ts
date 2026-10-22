import { outboundFetch } from "@/lib/outbound";
import { writeStructuredLog } from "@/observability/logger";
import { appendSmsDeliveryAttempt, readExotelConfig, type ExotelConfig } from "@/modules/notifications/exotel-sms";
import {
  readZeptoMailConfig, sendZeptoMailTemplate,
  type LegacyMailEvent, type ZeptoMailConfig, type ZeptoMailPurpose,
} from "@/modules/notifications/zeptomail-email";
import type { OutboundProvider } from "./service";
import {LEGACY_NOTIFICATION_CHANNELS,legacyChannelIsAllowed} from "./legacy-notification-channel-policy";
export {LEGACY_NOTIFICATION_CHANNELS} from "./legacy-notification-channel-policy";
import { outboundSendSchema, normalizeRecipient, type OutboundSendRequest } from "./model";
import { canContactRecipientAtRuntime } from "./runtime-safety";
import { isExotelAcceptedResponse } from "./provider-acceptance-model";
import { isCampaignTemplateKey } from "./template-boundary-model";

/** Templates are provisioned server-side; OTP IDs never enter this registry. */
export type OutboundTemplate = {
  zeptoTemplateKey?: string;
  exotelDltTemplateId?: string;
  exotelSenderId?: string;
  renderSms?: (variables: Record<string, string>) => string;
  legacyEvent?: LegacyMailEvent;
  /** Trusted college-specific sender settings, not caller-provided headers. */
  senderName?: string;
  fromAddress?: string;
  replyTo?: string;
  /** Optional human display label, never accepted as an arbitrary mailbox. */
  replyToName?: string;
  /** Explicit template-bound merge contract. Missing values never reach API. */
  requiredVariables?: readonly string[];
  /** At least one nonblank key in each group must be provided. */
  oneOfVariables?: readonly (readonly string[])[];
  /** Approved DLT SMS text is not necessarily the generic 1600-char limit. */
  maxSmsLength?: number;
};
export type OutboundProviderConfig = {
  email: ZeptoMailConfig;
  sms: ExotelConfig;
  templates: Readonly<Record<string, OutboundTemplate>>;
};
export type OutboundProviderOutcome =
  | { status: "ACCEPTED"; providerSid?: string }
  | { status: "NOT_CONFIGURED"; reason: string }
  | { status: "SUPPRESSED"; reason: string }
  | { status: "FAILED"; reason: string; httpStatus?: number };
export type OutboundProviderWithOutcomes = OutboundProvider & {
  sendDetailed(request: OutboundSendRequest): Promise<OutboundProviderOutcome>;
};

export function readOutboundProviderConfig(templates: OutboundProviderConfig["templates"]): OutboundProviderConfig {
  return { email: readZeptoMailConfig(), sms: readExotelConfig(), templates: registerLegacySmsTemplates(templates) };
}

/** Event-to-template contracts mirror registered ZeptoMail/DLT purposes.
 * A template may tighten but never bypass the generic variable checks. */
export const LEGACY_EVENT_MERGE_FIELDS: Partial<Readonly<Record<LegacyMailEvent,readonly string[]>>> = {
 JOB_INTERVIEW_SCHEDULED:["learnerName","jobTitle","companyName","applicationId",
  "roundDescription","interviewDate","interviewTime","interviewMode"],
 INTERVIEW_REMINDER:["learnerName","jobTitle","companyName","applicationId",
  "interviewDate","interviewTime","interviewMode"],
 INTERVIEW_CONFIRMED:["learnerName","jobTitle","companyName","applicationId",
  "interviewDate","interviewTime","interviewMode"],
 SYSTEM_EMAIL_VERIFICATION:["learnerName"],
 SYSTEM_APPLICATION_APPROVED:["learnerName","applicationId"],
 SYSTEM_APPLICATION_REJECTED:["learnerName","applicationId","rejectionReason"],
};
const RESERVED_TEMPLATE_VARIABLE=/^(?:__proto__|constructor|prototype|password|otp|apiKey|accessToken|secret)$/i;
export type OutboundVariableValidation =
 | {ok:true;clean:Record<string,string>}
 | {ok:false;code:"TEMPLATE_MERGE_MISSING"|"TEMPLATE_MERGE_INVALID";missing?:string};
export function validateOutboundTemplateVariables(
 variables:Record<string,string>,template:OutboundTemplate,
):OutboundVariableValidation{
 const clean:Record<string,string>=Object.create(null) as Record<string,string>;
 let total=0;
 const keys=Object.entries(variables);
 if(keys.length>25)return {ok:false,code:"TEMPLATE_MERGE_INVALID"};
 for(const [key,value] of keys){
  if(!/^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(key)||
   RESERVED_TEMPLATE_VARIABLE.test(key)||
   typeof value!=="string"||value.length>4000||
   /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value))return {
    ok:false,code:"TEMPLATE_MERGE_INVALID",
   };
  total+=key.length+value.length;
  if(total>12000)return {ok:false,code:"TEMPLATE_MERGE_INVALID"};
  clean[key]=value.trim();
 }
 const required=[...(template.legacyEvent?
  LEGACY_EVENT_MERGE_FIELDS[template.legacyEvent]??[]:[]),
  ...(template.requiredVariables??[])];
 for(const key of required){
  if(!/^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(key)||
   RESERVED_TEMPLATE_VARIABLE.test(key))return {ok:false,code:"TEMPLATE_MERGE_INVALID"};
  if(!clean[key])return {ok:false,code:"TEMPLATE_MERGE_MISSING",missing:key};
 }
 const eventLocationRequired=template.legacyEvent==="JOB_INTERVIEW_SCHEDULED"||
  template.legacyEvent==="INTERVIEW_REMINDER"||
  template.legacyEvent==="INTERVIEW_CONFIRMED";
 if(eventLocationRequired&&![
   "meetingLink","venueAddress","interviewLocation"
  ].some(key=>Boolean(clean[key])))
  return {ok:false,code:"TEMPLATE_MERGE_MISSING",
    missing:"meetingLink|venueAddress|interviewLocation"};
 for(const alternatives of template.oneOfVariables??[]){
  if(alternatives.length<1||alternatives.some(key=>
      !/^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(key)||
      RESERVED_TEMPLATE_VARIABLE.test(key)))return {ok:false,code:"TEMPLATE_MERGE_INVALID"};
  if(!alternatives.some(key=>Boolean(clean[key])))
   return {ok:false,code:"TEMPLATE_MERGE_MISSING",missing:alternatives.join("|")};
 }
 return {ok:true,clean};
}
/** An operator-safe summary suitable for previews; no addresses or credentials. */
export function outboundTemplateReadiness(
 templateKey:string,channel:"EMAIL"|"SMS",config:OutboundProviderConfig,
):{ready:boolean;reason:"READY"|"UNREGISTERED_TEMPLATE"|"EVENT_CHANNEL_DISABLED"|
 "EMAIL_TEMPLATE_NOT_PROVISIONED"|"SMS_TEMPLATE_NOT_PROVISIONED"}{
 const entry=config.templates[templateKey];
 if(!entry||!isCampaignTemplateKey(templateKey))
  return {ready:false,reason:"UNREGISTERED_TEMPLATE"};
 if(entry.legacyEvent&&!legacyChannelIsAllowed(entry.legacyEvent,channel))
  return {ready:false,reason:"EVENT_CHANNEL_DISABLED"};
 if(channel==="EMAIL"){
  const valid=Boolean(entry.zeptoTemplateKey&&
    isCampaignTemplateKey(entry.zeptoTemplateKey)&&
    entry.zeptoTemplateKey!==config.email.otpTemplateKey);
  return {ready:valid,reason:valid?"READY":"EMAIL_TEMPLATE_NOT_PROVISIONED"};
 }
 const valid=Boolean(entry.exotelDltTemplateId&&safeDltId(entry.exotelDltTemplateId)&&
  entry.exotelDltTemplateId!==config.sms.otpDltTemplateId&&
  safeSenderId(entry.exotelSenderId)&&entry.renderSms&&
  config.sms.apiKey.trim()&&config.sms.apiToken.trim());
 return {ready:valid,reason:valid?"READY":"SMS_TEMPLATE_NOT_PROVISIONED"};
}

/** Existing callers retain send():boolean; operators may inspect typed outcomes. */
export function createOutboundProvider(
  config: OutboundProviderConfig,
  fetchImpl: typeof fetch = fetch,
  env: Record<string, string | undefined> = process.env,
): OutboundProviderWithOutcomes {
  async function sendDetailedOnce(rawRequest: OutboundSendRequest): Promise<OutboundProviderOutcome> {
    const parsed = outboundSendSchema.safeParse(rawRequest);
    if (!parsed.success) return { status: "SUPPRESSED", reason: "INVALID_OUTBOUND_REQUEST" };
    const request = {
      ...parsed.data, recipient: normalizeRecipient(parsed.data.channel, parsed.data.recipient),
    };
    if (!canContactRecipientAtRuntime(request.channel, request.recipient, env)) {
      return { status: "SUPPRESSED", reason: "INVALID_OR_DISALLOWED_RECIPIENT" };
    }
    const template = config.templates[request.templateKey];
    if (!template || !isCampaignTemplateKey(request.templateKey)) {
      return { status: "NOT_CONFIGURED", reason: "UNREGISTERED_TEMPLATE" };
    }
    if (template.legacyEvent && !legacyChannelIsAllowed(template.legacyEvent,request.channel)) {
      return { status: "SUPPRESSED", reason: "EVENT_CHANNEL_DISABLED" };
    }
    const validation=validateOutboundTemplateVariables(request.variables,template);
    if(!validation.ok){
      return {status:"SUPPRESSED",reason:validation.code+
        (validation.missing?":"+validation.missing:"")};
    }
    const variables=validation.clean;
    if (request.channel === "EMAIL") {
      // Legacy templates have one location merge slot. An explicitly entered
      // meeting link or venue is mapped only after the one-of validation.
      if(template.legacyEvent==="INTERVIEW_REMINDER"||
         template.legacyEvent==="INTERVIEW_CONFIRMED"){
        variables["interviewLocation"]=variables["interviewLocation"] ||
          variables["meetingLink"] || variables["venueAddress"] || "";
      }
      if (!template.zeptoTemplateKey || !isCampaignTemplateKey(template.zeptoTemplateKey) ||
        template.zeptoTemplateKey === config.email.otpTemplateKey) {
        return { status: "NOT_CONFIGURED", reason: "EMAIL_TEMPLATE_NOT_PROVISIONED" };
      }
      // The trusted registry supplies the template ID. The common adapter
      // validates event merge fields, verified sender/reply headers, and provider
      // acceptance without leaking the address, token or content into logs.
      const purpose: ZeptoMailPurpose = template.legacyEvent
        ? { kind: "EVENT", event: template.legacyEvent }
        : { kind: "TPO", templateName: "registered_outbound" };
      const override = template.legacyEvent
        ? { ["ZEPTOMAIL_TEMPLATE_" + template.legacyEvent]: template.zeptoTemplateKey }
        : { ZEPTOMAIL_TEMPLATE_TPO_REGISTERED_OUTBOUND: template.zeptoTemplateKey };
      const effectiveEnv = { ...env, ...override };
      const result = await sendZeptoMailTemplate({
        purpose, toEmail: request.recipient,
        recipientName: variables["learnerName"] ?? variables["name"] ?? request.recipient,
        mergeInfo: variables,
        ...(template.senderName?.trim() ? {senderName: template.senderName.trim()} : {}),
        ...(template.fromAddress?.trim() ? {fromAddress: template.fromAddress.trim()} : {}),
        ...(template.replyTo?.trim() ? {replyTo: template.replyTo.trim()} : {}),
      }, config.email, fetchImpl, effectiveEnv);
      if (result.accepted) return { status: "ACCEPTED" };
      if (result.code === "TEMPLATE_NOT_CONFIGURED" || result.code === "TOKEN_NOT_CONFIGURED" ||
        result.code === "ENDPOINT_INVALID") {
        return { status: "NOT_CONFIGURED", reason: result.code };
      }
      if (result.code === "EVENT_EMAIL_DISABLED" || result.code === "DEV_RECIPIENT_NOT_ALLOWED" ||
        result.code === "RECIPIENT_REQUIRED" || result.code === "RECIPIENT_INVALID" ||
        result.code === "REQUIRED_VARIABLE_MISSING" || result.code === "MERGE_INFO_INVALID" ||
        result.code === "SENDER_UNVERIFIED" || result.code === "REPLY_TO_UNVERIFIED") {
        return { status: "SUPPRESSED", reason: result.code };
      }
      return { status: "FAILED", reason: result.code, ...(result.httpStatus
        ? { httpStatus: result.httpStatus } : {}) };
    }

    if (!config.sms.apiKey.trim() || !config.sms.apiToken.trim() ||
      !/^[A-Za-z0-9_-]+$/.test(config.sms.accountSid) ||
      !config.sms.dltEntityId.trim() || !template.exotelSenderId?.trim() ||
      !template.exotelDltTemplateId?.trim() || !template.renderSms ||
      template.exotelDltTemplateId === config.sms.otpDltTemplateId) {
      return { status: "NOT_CONFIGURED", reason: request.templateKey === "job.update"
        ? "JOB_DLT_TEMPLATE_ID_NOT_CONFIGURED" : "SMS_TEMPLATE_NOT_PROVISIONED" };
    }
    try {
      const body = template.renderSms(variables);
      const approvedBound=template.maxSmsLength&&template.maxSmsLength>0?
        Math.min(template.maxSmsLength,1600):1600;
      if (!body.trim() || body.length > approvedBound) {
        return { status: "SUPPRESSED", reason: "SMS_BODY_INVALID" };
      }
      const form = new URLSearchParams({
        From: template.exotelSenderId, To: request.recipient, Body: body,
        DltEntityId: config.sms.dltEntityId, DltTemplateId: template.exotelDltTemplateId,
        SmsType: config.sms.smsType, Priority: "normal",
      });
      const response = await outboundFetch(
        "https://api.exotel.com/v1/Accounts/" + config.sms.accountSid + "/Sms/send.json", {
          method: "POST",
          headers: {
            Authorization: "Basic " + Buffer.from(config.sms.apiKey + ":" + config.sms.apiToken).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: form, timeoutMs: 10_000, maxAttempts: 1, fetchImpl,
        },
      );
      if (!response.ok) return { status: "FAILED", reason: "SMS_PROVIDER_REJECTED", httpStatus: response.status };
      const payload: unknown = await response.json();
      if (!isExotelAcceptedResponse(payload)) {
        return { status: "FAILED", reason: "SMS_PROVIDER_NOT_ACCEPTED" };
      }
      const message=(payload as {SMSMessage:{Sid:string}}).SMSMessage;
      const sid=message.Sid.trim();
      if(!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/.test(sid)){
        // The acceptance ledger has a narrower SID shape than Exotel.
        // Without an auditable receipt, do not claim an accepted SMS send.
        return {status:"FAILED",reason:"SMS_PROVIDER_RECEIPT_INVALID"};
      }
      return { status: "ACCEPTED", providerSid:sid };
    } catch {
      return { status: "FAILED", reason: "SMS_PROVIDER_UNAVAILABLE" };
    }
  }
  async function sendDetailed(rawRequest: OutboundSendRequest): Promise<OutboundProviderOutcome> {
    const outcome = await sendDetailedOnce(rawRequest);
    // This is an independent append-on-send audit, not another provider send.
    // Reuse the same Exotel acceptance/failed outcome from the single bounded
    // request; never persist the SMS body, OTP, full recipient or credentials.
    // Suppressed/unconfigured events did not attempt provider delivery.
    if(rawRequest.channel==="SMS"&&(outcome.status==="ACCEPTED"||outcome.status==="FAILED")){
      await appendSmsDeliveryAttempt({
        purpose:rawRequest.templateKey==="job.update"?"job.update":"notification",
        recipient:normalizeRecipient("SMS",rawRequest.recipient),
        outcome:outcome.status==="ACCEPTED"?"PROVIDER_ACCEPTED":"FAILED",
        providerSid:outcome.status==="ACCEPTED"?outcome.providerSid??null:null,
        failureCode:outcome.status==="FAILED"?outcome.reason:null,
      });
    }
    if (outcome.status !== "ACCEPTED") {
      writeStructuredLog("WARNING", "messaging.provider_not_accepted", {
        channel: rawRequest.channel === "EMAIL" ? "EMAIL" : "SMS",
        outcome: outcome.status,
        reason: outcome.reason,
        ...(outcome.status === "FAILED" && outcome.httpStatus
          ? { httpStatus: outcome.httpStatus } : {}),
      });
    }
    return outcome;
  }
  return {
    sendDetailed,
    async send(rawRequest) {
      return (await sendDetailed(rawRequest)).status === "ACCEPTED";
    },
  };
}


/** The seven legacy job/SMS intents share exactly one TRAI-registered body. */
export const LEGACY_JOB_SMS_INTENTS = [
  "application-submitted", "shortlisted", "interview-round-update",
  "selected", "rejected", "interview.reminder", "interview.confirmed",
] as const;
export type LegacyJobSmsIntent = (typeof LEGACY_JOB_SMS_INTENTS)[number];

const DEFAULT_JOB_SMS_BODY =
  "Reminder: Hello {#var#}, You have an update on the 42 LMS Jobs Portal. Login to 42lms.com to check - JRSPF";

/** Remove the DLT token shape, bidi/format controls and excess whitespace. */
export function dltSafeRecipientName(raw: string | null | undefined): string {
  const normalized = (raw ?? "").replace(/\{#.*?#\}/g, "")
    .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]+/gu, " ")
    .replace(/\s+/gu, " ").trim();
  return Array.from(normalized || "User").slice(0, 30).join("").trim() || "User";
}

const safeDltId = (raw: string | undefined) =>
  Boolean(raw && /^[0-9]{10,24}$/.test(raw.trim()));
const safeSenderId = (raw: string | undefined) =>
  Boolean(raw && /^[A-Za-z0-9]{3,11}$/.test(raw.trim()));

/**
 * Deployment or an already-authorized settings reader must supply approved
 * DLT ID and exact registered body. The override is NOT user input. Missing
 * mappings fail closed and never fall back to OTP templates.
 */
export function legacyJobSmsTemplate(
  env: Record<string, string | undefined> = process.env,
  approvedOverrides: { dltId?: string; body?: string; senderId?: string } = {},
): OutboundTemplate | null {
  const dltId = (approvedOverrides.dltId ?? env["EXOTEL_JOB_DLT_TEMPLATE_ID"] ?? "").trim();
  const senderId = (approvedOverrides.senderId ?? env["EXOTEL_JOB_SENDER_ID"] ?? "FLERNR").trim();
  const body = approvedOverrides.body ?? env["EXOTEL_JOB_UPDATE_TEMPLATE_BODY"] ?? DEFAULT_JOB_SMS_BODY;
  if (!safeDltId(dltId) || !safeSenderId(senderId) ||
    !body.includes("{#var#}") || body.indexOf("{#var#}") !== body.lastIndexOf("{#var#}") ||
    body.length > 1500) return null;
  return {
    exotelDltTemplateId: dltId,
    exotelSenderId: senderId,
    oneOfVariables:[["learnerName","recipientName"]],
    requiredVariables:[],
    maxSmsLength:1600,
    renderSms: (variables) => body.replace("{#var#}",
      dltSafeRecipientName(variables["learnerName"] ?? variables["recipientName"])),
  };
}

export function registerLegacySmsTemplates(
  templates: OutboundProviderConfig["templates"],
  env: Record<string, string | undefined> = process.env,
  approvedOverrides: { dltId?: string; body?: string; senderId?: string } = {},
): OutboundProviderConfig["templates"] {
  const job = legacyJobSmsTemplate(env, approvedOverrides);
  // Preserve explicit caller registrations; no silent OTP/global overrides.
  return job && !Object.hasOwn(templates, "job.update")
    ? { ...templates, "job.update": job } : templates;
}

export async function sendLegacyJobUpdateSms(
  provider: OutboundProviderWithOutcomes,
  intent: string,
  recipient: string,
  recipientName: string,
): Promise<OutboundProviderOutcome> {
  if (!(LEGACY_JOB_SMS_INTENTS as readonly string[]).includes(intent)) {
    return { status: "SUPPRESSED", reason: "UNSUPPORTED_JOB_SMS_INTENT" };
  }
  return provider.sendDetailed({
    channel: "SMS",
    recipient,
    templateKey: "job.update",
    purpose: "legacy-job-sms:" + intent,
    variables: { learnerName: dltSafeRecipientName(recipientName) },
  });
}

/**
 * Attendance/absence notices require a separately provisioned exact template;
 * arbitrary text is never treated as a verified TRAI-approved SMS.
 */
export async function sendApprovedNotificationSms(
  provider: OutboundProviderWithOutcomes,
  templateKey: string,
  recipient: string,
  variables: Record<string, string>,
): Promise<OutboundProviderOutcome> {
  if (!isCampaignTemplateKey(templateKey) || templateKey === "job.update") {
    return { status: "NOT_CONFIGURED", reason: "NOTIFICATION_DLT_TEMPLATE_REQUIRED" };
  }
  return provider.sendDetailed({
    channel: "SMS",
    recipient,
    templateKey,
    purpose: "legacy-notification:" + templateKey,
    variables,
  });
}


/**
 * Notices must have independently registered DLT IDs and exact texts.
 * The constructor does NOT accept an arbitrary SMS body at delivery time:
 * an owner-provisioned template and its approved variable slots are required.
 */
export function registeredNoticeSmsTemplate(
  env: Record<string, string | undefined> = process.env,
  approvedBody?: string,
  approvedDltId?: string,
): OutboundTemplate | null {
  const senderId = (env["EXOTEL_NOTIFICATION_SENDER_ID"] ?? "FLERNR").trim();
  const dltId = (approvedDltId ?? env["EXOTEL_NOTIFICATION_DLT_TEMPLATE_ID"] ?? "").trim();
  const body = (approvedBody ?? env["EXOTEL_NOTIFICATION_TEMPLATE_BODY"] ?? "").trim();
  if (!safeSenderId(senderId) || !safeDltId(dltId) ||
    body.length < 1 || body.length > 1500 ||
    !body.includes("{#var#}") ||
    body.indexOf("{#var#}") !== body.lastIndexOf("{#var#}")) return null;
  return {
    exotelSenderId: senderId, exotelDltTemplateId: dltId,
    oneOfVariables:[["recipientName","learnerName"]],
    maxSmsLength:1600,
    renderSms: (variables) => body.replace("{#var#}",
      dltSafeRecipientName(variables["recipientName"] ?? variables["learnerName"])),
  };
}

/** The provider itself records a redacted, append-only Exotel attempt after
 * its single bounded send. Upstream delivery receipts still authorize the
 * dispatch and retain scoped message history; this operational attempt log
 * cannot manufacture consent or a delivered-handset claim.
 */
/** Attendance notices have three DLT-approved substitution slots.
 * Values are plain text from authorized schedule/course data, not HTML.
 */
export function registeredAttendanceSmsTemplate(
 purpose:"attendance.absence"|"attendance.correction",
 env:Record<string,string|undefined>=process.env,
):OutboundTemplate|null {
 const key=purpose==="attendance.absence"?"ABSENCE":"CORRECTION";
 const dltId=(env["EXOTEL_ATTENDANCE_"+key+"_DLT_TEMPLATE_ID"]??"").trim();
 const senderId=(env["EXOTEL_ATTENDANCE_SENDER_ID"]??"FLERNR").trim();
 const body=(env["EXOTEL_ATTENDANCE_"+key+"_TEMPLATE_BODY"]??"").trim();
 if(!safeDltId(dltId)||!safeSenderId(senderId)||body.length>1500 ||
    (body.match(/%s/g)??[]).length!==3)return null;
 return {exotelDltTemplateId:dltId,exotelSenderId:senderId,
  requiredVariables:["courseName","startTime","endTime"],
  maxSmsLength:1000,
  renderSms:variables=>{
   const cleaned=(raw:string|undefined)=>String(raw??"").replace(/[\\r\\n<>]/g," ").trim().slice(0,80);
   let index=0;
   const values=[cleaned(variables["courseName"]),cleaned(variables["startTime"]),cleaned(variables["endTime"])];
   return body.replace(/%s/g,()=>values[index++]??"");
  }};
}
export function legacyEventSmsTemplateKey(event: LegacyMailEvent): string | null {
  if (!LEGACY_NOTIFICATION_CHANNELS[event].includes("SMS")) return null;
  return "job.update";
}


/** Legacy TpoMailService was not a browser-side mail API. Trigger mapping
 * records which verified sender owns each workflow. The caller must invoke
 * that workflow's tenant-scoped producer (including suppression, replay and
 * template authorization); never send directly based on a client trigger. */
export const LEGACY_TPO_EMAIL_WORKFLOW_FACADE={
 RECRUITER_INVITATION:"recruiter-invitation",
 DRIVE_ANNOUNCEMENT:"tpo-drive-announcements",
 JOB_INTERVIEW_SCHEDULED:"placement-round-notifications",
 JOB_OFFER_EXTENDED:"placement-offer-release",
 INTERVIEW_REMINDER:"placement-round-notifications",
 RECRUITER_MESSAGE:"recruiter-message-email-dispatch",
 CAMPAIGN:"tpo-email-campaign",
} as const;
export type LegacyTpoEmailTrigger=keyof typeof LEGACY_TPO_EMAIL_WORKFLOW_FACADE;
export function legacyTpoEmailWorkflowRoute(trigger:LegacyTpoEmailTrigger){
 return LEGACY_TPO_EMAIL_WORKFLOW_FACADE[trigger];
}
