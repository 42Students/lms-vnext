import { outboundFetch } from "@/lib/outbound";
import { readExotelConfig, type ExotelConfig } from "@/modules/notifications/exotel-sms";
import { readZeptoMailConfig, isSecureMailProviderEndpoint, type ZeptoMailConfig } from "@/modules/notifications/zeptomail-email";
import type { OutboundProvider } from "./service";
import {outboundSendSchema,normalizeRecipient,type OutboundSendRequest } from "./model";
import { canContactRecipientAtRuntime } from "./runtime-safety";
import {isExotelAcceptedResponse} from "./provider-acceptance-model";
import {isCampaignTemplateKey} from "./template-boundary-model";

/** Templates are explicitly provisioned; OTP identifiers must never be reused for campaigns. */
export type OutboundTemplate = {
  zeptoTemplateKey?: string;
  exotelDltTemplateId?: string;
  exotelSenderId?: string;
  /** Exotel DLT-registered exact rendered content. */
  renderSms?: (variables: Record<string, string>) => string;
};
export type OutboundProviderConfig = {
  email: ZeptoMailConfig;
  sms: ExotelConfig;
  templates: Readonly<Record<string, OutboundTemplate>>;
};
export function readOutboundProviderConfig(templates: OutboundProviderConfig["templates"]): OutboundProviderConfig {
  return { email: readZeptoMailConfig(), sms: readExotelConfig(), templates };
}
export function createOutboundProvider(
  config: OutboundProviderConfig,
  fetchImpl: typeof fetch = fetch,
  env: Record<string, string | undefined> = process.env,
): OutboundProvider {
  return {
    async send(rawRequest: OutboundSendRequest): Promise<boolean> {
      // This guard is inside the provider: callers cannot bypass it by passing an unsafe policy.
      // Use the parsed, canonical address throughout the provider request rather
      // than validating a trimmed value and sending untrimmed caller input.
      const parsed = outboundSendSchema.safeParse(rawRequest);
      if (!parsed.success) return false;
      const request = {...parsed.data,recipient:normalizeRecipient(parsed.data.channel,parsed.data.recipient)};
      if (!canContactRecipientAtRuntime(request.channel, request.recipient, env)) return false;
      const template = config.templates[request.templateKey];
      if (!template || !isCampaignTemplateKey(request.templateKey)) return false;
      try {
        if (request.channel === "EMAIL") {
          if (!config.email.token.trim() || !isSecureMailProviderEndpoint(config.email.apiUrl) || !template.zeptoTemplateKey ||
              !isCampaignTemplateKey(template.zeptoTemplateKey) ||
              template.zeptoTemplateKey === config.email.otpTemplateKey) return false;
          const response = await outboundFetch(config.email.apiUrl, {
            method: "POST",
            headers: { Authorization: config.email.token, "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              template_key: template.zeptoTemplateKey,
              from: { address: config.email.fromAddress, name: config.email.fromName },
              to: [{ email_address: { address: request.recipient, name: request.recipient } }],
              merge_info: request.variables,
            }),
            timeoutMs: 10000,
            maxAttempts: 1, // No unconfirmed POST retry to avoid duplicate messages.
            fetchImpl,
          });
          return response.ok;
        }
        if (!config.sms.apiKey.trim() || !config.sms.apiToken.trim() || !/^[A-Za-z0-9_-]+$/.test(config.sms.accountSid) ||
            !config.sms.dltEntityId.trim() || !template.exotelSenderId?.trim() || !template.exotelDltTemplateId?.trim() || !template.renderSms ||
            template.exotelDltTemplateId === config.sms.otpDltTemplateId) return false;
        const body = template.renderSms(request.variables);
        if (!body.trim() || body.length > 1600) return false;
        const form = new URLSearchParams({
          From: template.exotelSenderId, To: request.recipient, Body: body,
          DltEntityId: config.sms.dltEntityId, DltTemplateId: template.exotelDltTemplateId,
          SmsType: config.sms.smsType, Priority: "normal",
        });
        const response = await outboundFetch(`https://api.exotel.com/v1/Accounts/${config.sms.accountSid}/Sms/send.json`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${config.sms.apiKey}:${config.sms.apiToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: form,
          timeoutMs: 10000,
          maxAttempts: 1, // No unconfirmed POST retry to avoid duplicate messages.
          fetchImpl,
        });
        if (!response.ok) return false;
        const result = (await response.json()) as { SMSMessage?: { Sid?: string; Status?: string } };
        return isExotelAcceptedResponse(result);
      } catch {
        // No credentials, recipients or rendered messages enter logs.
        return false;
      }
    },
  };
}
