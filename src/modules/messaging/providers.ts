import { outboundFetch } from "@/lib/outbound";
import { readExotelConfig, type ExotelConfig } from "@/modules/notifications/exotel-sms";
import {
  readZeptoMailConfig, sendZeptoMailTemplate,
  type LegacyMailEvent, type ZeptoMailConfig, type ZeptoMailPurpose,
} from "@/modules/notifications/zeptomail-email";
import type { OutboundProvider } from "./service";
import { outboundSendSchema, normalizeRecipient, type OutboundSendRequest } from "./model";
import { canContactRecipientAtRuntime } from "./runtime-safety";
import { isExotelAcceptedResponse } from "./provider-acceptance-model";
import { isCampaignTemplateKey } from "./template-boundary-model";

/** Legacy NotificationEventRegistry channel policy, as of 13 October 2026. */
export const LEGACY_NOTIFICATION_CHANNELS: Readonly<Record<LegacyMailEvent, readonly ("IN_APP" | "EMAIL" | "SMS")[]>> = {
  JOB_APPLICATION_CONFIRMATION: ["IN_APP", "SMS"],
  JOB_SHORTLISTED: ["IN_APP", "SMS"],
  JOB_ASSESSMENT_INVITE: ["IN_APP"],
  JOB_INTERVIEW_SCHEDULED: ["IN_APP", "EMAIL", "SMS"],
  JOB_OFFER_EXTENDED: ["IN_APP"],
  JOB_HIRED: ["IN_APP"],
  JOB_APPLICATION_REJECTED: ["IN_APP", "SMS"],
  JOB_WAITLISTED: ["IN_APP"],
  INTERVIEW_REMINDER: ["IN_APP", "EMAIL", "SMS"],
  INTERVIEW_CONFIRMED: ["IN_APP", "EMAIL", "SMS"],
  INTERVIEW_CANCELLED: ["IN_APP"],
  INTERVIEW_RESCHEDULED: ["IN_APP"],
  COURSE_ASSIGNMENT_DUE: ["IN_APP"],
  COURSE_ASSIGNMENT_SUBMITTED: ["IN_APP"],
  COURSE_GRADE_PUBLISHED: ["IN_APP"],
  SYSTEM_EMAIL_VERIFICATION: ["EMAIL"],
  SYSTEM_APPLICATION_APPROVED: ["EMAIL"],
  SYSTEM_APPLICATION_REJECTED: ["EMAIL"],
};

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
};
export type OutboundProviderConfig = {
  email: ZeptoMailConfig;
  sms: ExotelConfig;
  templates: Readonly<Record<string, OutboundTemplate>>;
};
export type OutboundProviderOutcome =
  | { status: "ACCEPTED" }
  | { status: "NOT_CONFIGURED"; reason: string }
  | { status: "SUPPRESSED"; reason: string }
  | { status: "FAILED"; reason: string; httpStatus?: number };
export type OutboundProviderWithOutcomes = OutboundProvider & {
  sendDetailed(request: OutboundSendRequest): Promise<OutboundProviderOutcome>;
};

export function readOutboundProviderConfig(templates: OutboundProviderConfig["templates"]): OutboundProviderConfig {
  return { email: readZeptoMailConfig(), sms: readExotelConfig(), templates };
}

/** Existing callers retain send():boolean; operators may inspect typed outcomes. */
export function createOutboundProvider(
  config: OutboundProviderConfig,
  fetchImpl: typeof fetch = fetch,
  env: Record<string, string | undefined> = process.env,
): OutboundProviderWithOutcomes {
  async function sendDetailed(rawRequest: OutboundSendRequest): Promise<OutboundProviderOutcome> {
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
    if (template.legacyEvent && !LEGACY_NOTIFICATION_CHANNELS[template.legacyEvent]?.includes(request.channel)) {
      return { status: "SUPPRESSED", reason: "EVENT_CHANNEL_DISABLED" };
    }
    if (request.channel === "EMAIL") {
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
        recipientName: request.variables.learnerName ?? request.variables.name ?? request.recipient,
        mergeInfo: request.variables,
        senderName: template.senderName?.trim() || undefined,
        fromAddress: template.fromAddress?.trim() || undefined,
        replyTo: template.replyTo?.trim() || undefined,
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
      return { status: "NOT_CONFIGURED", reason: "SMS_TEMPLATE_NOT_PROVISIONED" };
    }
    try {
      const body = template.renderSms(request.variables);
      if (!body.trim() || body.length > 1600) {
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
      if (!isExotelAcceptedResponse(payload as { SMSMessage?: { Sid?: string; Status?: string } })) {
        return { status: "FAILED", reason: "SMS_PROVIDER_NOT_ACCEPTED" };
      }
      return { status: "ACCEPTED" };
    } catch {
      return { status: "FAILED", reason: "SMS_PROVIDER_UNAVAILABLE" };
    }
  }
  return {
    sendDetailed,
    async send(rawRequest) {
      return (await sendDetailed(rawRequest)).status === "ACCEPTED";
    },
  };
}
