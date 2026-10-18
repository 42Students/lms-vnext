import { outboundFetch } from "@/lib/outbound";
import { writeStructuredLog } from "@/observability/logger";
import type { EmailProvider } from "./types";
import { isValidRecipient, normalizeRecipient } from "@/modules/messaging/model";

/**
 * ZeptoMail template email (India region), matching the legacy integration.
 * The OTP template merges: otp, learnerName, email, mobile, expiryMinutes.
 */

export type ZeptoMailConfig = {
  apiUrl: string;
  token: string;
  otpTemplateKey: string;
  fromAddress: string;
  fromName: string;
};

export function readZeptoMailConfig(
  env: Record<string, string | undefined> = process.env,
): ZeptoMailConfig {
  return {
    apiUrl:
      env.ZEPTOMAIL_API_URL ??
      "https://api.zeptomail.in/v1.1/email/template",
    token: (env.ZEPTOMAIL_TOKEN ?? "").trim().replace(/^"|"$/g, ""),
    otpTemplateKey:
      env.ZEPTOMAIL_OTP_TEMPLATE_KEY ??
      "2518b.4c361928d9526a75.k1.aea6cef0-4e4a-11f1-97e6-e256a66a52e4.19e1e1f015f",
    fromAddress: env.ZEPTOMAIL_FROM_ADDRESS ?? "hello@42lms.com",
    fromName: env.ZEPTOMAIL_FROM_NAME ?? "42Learn",
  };
}

/** Reject plaintext, embedded URL credentials and malformed provider endpoints. */
export function isSecureMailProviderEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function createZeptoMailEmailProvider(
  config: ZeptoMailConfig = readZeptoMailConfig(),
  fetchImpl: typeof fetch = fetch,
): EmailProvider {
  return {
    async sendOtpEmail(message) {
      const recipient = normalizeRecipient("EMAIL", message.toEmail);
      if (
        !config.token.trim() ||
        !isSecureMailProviderEndpoint(config.apiUrl) ||
        !config.otpTemplateKey.trim() ||
        !isValidRecipient("EMAIL", recipient) ||
        !/^[0-9]{4,8}$/.test(message.code)
      ) {
        writeStructuredLog("WARNING", "email.otp_not_sent", {
          reason: "configuration_or_message_invalid",
        });
        return false;
      }

      try {
        const response = await outboundFetch(config.apiUrl, {
          method: "POST",
          headers: {
            Authorization: config.token,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            template_key: config.otpTemplateKey,
            from: {
              address: config.fromAddress,
              name: config.fromName,
            },
            to: [
              {
                email_address: {
                  address: recipient,
                  name: recipient,
                },
              },
            ],
            merge_info: {
              otp: message.code,
              learnerName: message.displayName,
              email: recipient,
              mobile: message.phoneE164 ?? "",
              expiryMinutes: "5",
            },
          }),
          timeoutMs: 10_000,
          maxAttempts: 1, // OTP POST has no provider idempotency guarantee.
          fetchImpl,
        });

        if (!response.ok) {
          writeStructuredLog("WARNING", "email.otp_not_accepted", {
            httpStatus: response.status,
          });
          return false;
        }

        writeStructuredLog("INFO", "email.otp_accepted", {});
        return true;
      } catch (error) {
        writeStructuredLog("WARNING", "email.otp_request_failed", {
          errorType:
            error instanceof Error ? error.name : "UnknownError",
        });
        return false;
      }
    },
  };
}
