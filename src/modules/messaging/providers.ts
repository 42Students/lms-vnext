import { readExotelConfig, type ExotelConfig } from "@/modules/notifications/exotel-sms";
import { readZeptoMailConfig, type ZeptoMailConfig } from "@/modules/notifications/zeptomail-email";
import type { OutboundProvider } from "./service";
import type { OutboundSendRequest } from "./model";
import { canContactRecipientAtRuntime } from "./runtime-safety";
import {isExotelAcceptedResponse} from "./provider-acceptance-model";

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
    async send(request: OutboundSendRequest): Promise<boolean> {
      // This guard is inside the provider: callers cannot bypass it by passing an unsafe policy.
      if (!canContactRecipientAtRuntime(request.channel, request.recipient, env)) return false;
      const template = config.templates[request.templateKey];
      if (!template) return false;
      try {
        if (request.channel === "EMAIL") {
          if (!config.email.token || !template.zeptoTemplateKey) return false;
          const response = await fetchImpl(config.email.apiUrl, {
            method: "POST",
            headers: { Authorization: config.email.token, "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              template_key: template.zeptoTemplateKey,
              from: { address: config.email.fromAddress, name: config.email.fromName },
              to: [{ email_address: { address: request.recipient, name: request.recipient } }],
              merge_info: request.variables,
            }),
            signal: AbortSignal.timeout(10000),
          });
          return response.ok;
        }
        if (!config.sms.apiKey || !config.sms.apiToken || !/^[A-Za-z0-9_-]+$/.test(config.sms.accountSid) ||
            !config.sms.dltEntityId || !template.exotelSenderId || !template.exotelDltTemplateId || !template.renderSms) return false;
        const body = template.renderSms(request.variables);
        if (!body.trim() || body.length > 1600) return false;
        const form = new URLSearchParams({
          From: template.exotelSenderId, To: request.recipient, Body: body,
          DltEntityId: config.sms.dltEntityId, DltTemplateId: template.exotelDltTemplateId,
          SmsType: config.sms.smsType, Priority: "normal",
        });
        const response = await fetchImpl(`https://api.exotel.com/v1/Accounts/${config.sms.accountSid}/Sms/send.json`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${config.sms.apiKey}:${config.sms.apiToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: form,
          signal: AbortSignal.timeout(10000),
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
