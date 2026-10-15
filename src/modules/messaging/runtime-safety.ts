import { parseAuthTestAllowlist } from "./allowlist";
import { isValidRecipient, normalizeRecipient } from "./model";
/** Read the same AUTH test recipient lists used by login; missing APP_ENV is never production. */
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
