import "server-only";

import { readZeptoMailConfig, isSecureMailProviderEndpoint } from "@/modules/notifications/zeptomail-email";
import { canContactRecipientAtRuntime } from "./runtime-safety";
import {normalizeRecipient} from "./model";

/** Separate join-code purpose, but still owned by the shared messaging module.
 * Never print codes, credentials or recipient details.
 */
export async function deliverPublicRecruiterJoinCode(
  email: string, code: string, fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const recipient=normalizeRecipient("EMAIL",email);
  if (!canContactRecipientAtRuntime("EMAIL",recipient)) return false;
  const config = readZeptoMailConfig();
  if (!config.token.trim() || !isSecureMailProviderEndpoint(config.apiUrl) || !config.otpTemplateKey.trim() || !/^[0-9]{6}$/.test(code)) return false;
  try {
    const response = await fetchImpl(config.apiUrl, {
      method: "POST",
      // Never forward recruiter join codes or provider credentials via an HTTP redirect.
      redirect: "error",
      headers: { Authorization: config.token, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        template_key: config.otpTemplateKey,
        from: { address: config.fromAddress, name: config.fromName },
        to: [{ email_address: { address: recipient, name: recipient } }],
        merge_info: {
          otp: code, learnerName: "Recruiter", email:recipient, mobile: "", expiryMinutes: "10",
        },
      }),
      signal: AbortSignal.timeout(10000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
