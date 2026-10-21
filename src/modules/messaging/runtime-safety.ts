import { parseAuthTestAllowlist } from "./allowlist";
import { isValidRecipient, normalizeRecipient } from "./model";
/** Read the same AUTH test recipient lists used by login; missing APP_ENV is never production.
 * Legacy STAGE/DEV_MAIL_ALLOW could allow an entire @domain. That broad
 * behavior is intentionally not honored: nonproduction sending is limited
 * to explicitly configured exact recipients in AUTH_TEST_EMAILS/PHONES.
 * Never allow a dev domain wildcard to deliver to real users.
 */
export function canContactRecipientAtRuntime(
  channel: "EMAIL" | "SMS",
  rawRecipient: string,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const recipient = normalizeRecipient(channel, rawRecipient);
  if (!isValidRecipient(channel, recipient)) return false;
  if (env.APP_ENV === "production") return true;
  const allowlist = parseAuthTestAllowlist({
    emailAddresses: env.AUTH_TEST_EMAILS,
    phoneNumbers: env.AUTH_TEST_PHONES,
  });
  return channel === "EMAIL"
    ? allowlist.testEmails.includes(recipient)
    : allowlist.testPhones.includes(recipient);
}

/** Privacy-safe nonproduction suppression classification without logging
 * recipients, domains, provider tokens or content.
 */
export function recipientRuntimeSuppressionReason(
 channel:"EMAIL"|"SMS",rawRecipient:string,
 env:Record<string,string|undefined>=process.env,
):"INVALID_RECIPIENT"|"SUPPRESSED_NONPROD"|null{
 const recipient=normalizeRecipient(channel,rawRecipient);
 if(!isValidRecipient(channel,recipient))return "INVALID_RECIPIENT";
 return canContactRecipientAtRuntime(channel,rawRecipient,env)?null:"SUPPRESSED_NONPROD";
}
