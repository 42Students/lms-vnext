import { outboundFetch } from "@/lib/outbound";
import { writeStructuredLog } from "@/observability/logger";
import type { SmsProvider } from "./types";

/**
 * Exotel transactional SMS, matching the legacy LMS integration.
 * Indian DLT rules require the registered entity, sender and template IDs;
 * a missing value fails closed instead of sending an unregistered message.
 */

const OTP_SUFFIX =
  " is the One Time Password (OTP) to access your account at 42LMS.COM. " +
  "For security reasons, please do not share this OTP with anyone. -JRSPF.";

export type ExotelConfig = {
  apiKey: string;
  apiToken: string;
  accountSid: string;
  dltEntityId: string;
  otpSenderId: string;
  otpDltTemplateId: string;
  smsType: string;
};

export function readExotelConfig(
  env: Record<string, string | undefined> = process.env,
): ExotelConfig {
  return {
    apiKey: env.EXOTEL_API_KEY ?? "",
    apiToken: env.EXOTEL_API_TOKEN ?? "",
    accountSid: env.EXOTEL_ACCOUNT_SID ?? "42students1",
    dltEntityId: env.EXOTEL_DLT_ENTITY_ID ?? "1001650442971323333",
    otpSenderId: env.EXOTEL_OTP_SENDER_ID ?? "FLERNR",
    otpDltTemplateId:
      env.EXOTEL_OTP_DLT_TEMPLATE_ID ?? "1707176554481180936",
    smsType: env.EXOTEL_OTP_SMS_TYPE ?? "transactional_opt_in",
  };
}

function configured(config: ExotelConfig) {
  return Boolean(
    config.apiKey &&
      config.apiToken &&
      config.accountSid &&
      config.dltEntityId &&
      config.otpSenderId &&
      config.otpDltTemplateId,
  );
}

export function createExotelSmsProvider(
  config: ExotelConfig = readExotelConfig(),
  fetchImpl: typeof fetch = fetch,
): SmsProvider {
  return {
    async sendOtp(phoneE164, code) {
      if (!/^[0-9]{4,8}$/.test(code)) {
        writeStructuredLog("WARNING", "sms.otp_rejected", {
          reason: "invalid_code_format",
        });
        return false;
      }

      if (
        !configured(config) ||
        !/^[A-Za-z0-9_-]+$/.test(config.accountSid) ||
        !/^\+[1-9][0-9]{7,14}$/.test(phoneE164)
      ) {
        writeStructuredLog("WARNING", "sms.otp_not_sent", {
          reason: "configuration_or_recipient_invalid",
        });
        return false;
      }

      const form = new URLSearchParams({
        From: config.otpSenderId,
        To: phoneE164,
        Body: `${code}${OTP_SUFFIX}`,
        DltEntityId: config.dltEntityId,
        DltTemplateId: config.otpDltTemplateId,
        SmsType: config.smsType,
        Priority: "high",
      });

      try {
        const response = await outboundFetch(
          // The ".json" suffix selects JSON; without it Exotel answers XML.
          `https://api.exotel.com/v1/Accounts/${config.accountSid}/Sms/send.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${config.apiKey}:${config.apiToken}`,
              ).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
            },
            body: form,
            timeoutMs: 10_000,
            maxAttempts: 1, // OTP POST has no provider idempotency guarantee.
            fetchImpl,
          },
        );

        if (!response.ok) {
          writeStructuredLog("WARNING", "sms.otp_not_accepted", {
            httpStatus: response.status,
          });
          return false;
        }

        const body = (await response.json()) as {
          SMSMessage?: { Sid?: string; Status?: string };
        };
        const sid = body.SMSMessage?.Sid ?? "";
        const status = (body.SMSMessage?.Status ?? "").toLowerCase();

        if (!sid || !status || status.startsWith("failed")) {
          writeStructuredLog("WARNING", "sms.otp_not_accepted", {
            providerStatus: status,
          });
          return false;
        }

        // "Accepted" is not handset delivery.
        writeStructuredLog("INFO", "sms.otp_accepted", {
          providerStatus: status,
          recipientSuffix: phoneE164.slice(-4),
        });
        return true;
      } catch (error) {
        // Never log the URL, credentials, phone, code or response body.
        writeStructuredLog("WARNING", "sms.otp_request_failed", {
          errorType:
            error instanceof Error ? error.name : "UnknownError",
        });
        return false;
      }
    },
  };
}
