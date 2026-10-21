import { outboundFetch } from "@/lib/outbound";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { writeStructuredLog } from "@/observability/logger";
import type { SmsProvider } from "./types";
import { isExotelAcceptedResponse } from "@/modules/messaging/provider-acceptance-model";

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

/** Normalize old Indian 10-digit / 91-prefixed numbers, preserving E.164. */
export function normalizeSmsPhoneForIndia(input: string): string | null {
  const compact = input.replace(/[\s()-]/g, "");
  if (/^[6-9][0-9]{9}$/.test(compact)) return "+91" + compact;
  if (/^91[6-9][0-9]{9}$/.test(compact)) return "+" + compact;
  return /^\+[1-9][0-9]{7,14}$/.test(compact) ? compact : null;
}

/** DB-031 append-only attempt (ready only after database lane registers migration).
 * No full phone, SMS body, OTP or secret is persisted. Ledger failures cannot
 * change provider acceptance or trigger an ambiguous retry. */
async function bestEffortOtpAttempt(
  phone: string, outcome: "PROVIDER_ACCEPTED" | "FAILED",
  providerSid: string | null, failureCode: string | null,
): Promise<void> {
  const suffix = phone.replace(/[^0-9]/g, "").slice(-4) || null;
  try {
    const db = getDb();
    const readyResult = await db.execute(sql`select to_regclass('public.sms_delivery_attempts') is not null as ready`);
    const rows = Array.isArray(readyResult)
      ? readyResult : ((readyResult as { rows?: unknown[] }).rows ?? []);
    if ((rows[0] as { ready?: boolean } | undefined)?.ready !== true) {
      writeStructuredLog("WARNING", "sms.delivery_attempt_ledger_unavailable",
        { purpose: "otp", reason: "DB31_NOT_REGISTERED" });
      return;
    }
    await db.execute(sql`
      insert into sms_delivery_attempts
        (purpose, provider, recipient_suffix, outcome, provider_message_id,
         safe_failure_code, provider_accepted_at)
      values ('otp', 'EXOTEL', ${suffix}, ${outcome}, ${providerSid},
        ${failureCode}, ${outcome === "PROVIDER_ACCEPTED" ? new Date() : null})
    `);
  } catch {
    writeStructuredLog("WARNING", "sms.delivery_attempt_ledger_write_failed",
      { purpose: "otp", reason: "ATTEMPT_AUDIT_UNAVAILABLE" });
  }
}
function configured(config: ExotelConfig) {
  return Boolean(
    config.apiKey.trim() &&
      config.apiToken.trim() &&
      config.accountSid.trim() &&
      config.dltEntityId.trim() &&
      config.otpSenderId.trim() &&
      config.otpDltTemplateId.trim(),
  );
}

export function createExotelSmsProvider(
  config: ExotelConfig = readExotelConfig(),
  fetchImpl: typeof fetch = fetch,
): SmsProvider {
  return {
    async sendOtp(phoneE164, code) {
      const canonicalPhone = normalizeSmsPhoneForIndia(phoneE164);
      if (!/^[0-9]{4,8}$/.test(code)) {
        writeStructuredLog("WARNING", "sms.otp_rejected", {
          reason: "invalid_code_format",
        });
        await bestEffortOtpAttempt(canonicalPhone ?? "", "FAILED", null, "INVALID_OTP_FORMAT");
        return false;
      }

      if (
        !configured(config) ||
        !/^[A-Za-z0-9_-]+$/.test(config.accountSid) ||
        !canonicalPhone
      ) {
        writeStructuredLog("WARNING", "sms.otp_not_sent", {
          reason: "configuration_or_recipient_invalid",
        });
        await bestEffortOtpAttempt(canonicalPhone ?? "", "FAILED", null,
          canonicalPhone ? "OTP_PROVIDER_NOT_CONFIGURED" : "RECIPIENT_INVALID");
        return false;
      }

      const form = new URLSearchParams({
        From: config.otpSenderId,
        To: canonicalPhone!,
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
          await bestEffortOtpAttempt(canonicalPhone!, "FAILED", null, "PROVIDER_HTTP_REJECTED");
          return false;
        }

        const body = (await response.json()) as {
          SMSMessage?: { Sid?: string; Status?: string };
        };
        const accepted = isExotelAcceptedResponse(body);
        const status = (body.SMSMessage?.Status ?? "").trim().toLowerCase();
        if (!accepted) {
          writeStructuredLog("WARNING", "sms.otp_not_accepted", {
            providerStatus: status.slice(0, 32),
          });
          await bestEffortOtpAttempt(canonicalPhone!, "FAILED", null, "PROVIDER_NOT_ACCEPTED");
          return false;
        }

        // Provider acceptance is not proof of handset delivery.
        writeStructuredLog("INFO", "sms.otp_accepted", {
          providerStatus: status,
          recipientSuffix: canonicalPhone!.slice(-4),
        });
        await bestEffortOtpAttempt(canonicalPhone!, "PROVIDER_ACCEPTED",
          body.SMSMessage?.Sid ?? null, null);
        return true;
      } catch (error) {
        // Never log the URL, credentials, phone, code or response body.
        writeStructuredLog("WARNING", "sms.otp_request_failed", {
          errorType:
            error instanceof Error ? error.name : "UnknownError",
        });
        await bestEffortOtpAttempt(canonicalPhone ?? "", "FAILED", null, "PROVIDER_UNAVAILABLE");
        return false;
      }
    },
  };
}
