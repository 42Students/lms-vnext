/** The caller passes the existing auth test allowlists; do not mint a second allowlist configuration. */
export type AuthTestAllowlist = { testEmails: readonly string[]; testPhones: readonly string[] };
export function parseAuthTestAllowlist(input: {
  emailAddresses?: string | null;
  phoneNumbers?: string | null;
}): AuthTestAllowlist {
  const items = (value: string | null | undefined) =>
    (value ?? "").split(",").map(item => item.trim()).filter(Boolean);
  return {
    testEmails: [...new Set(items(input.emailAddresses).map(value => value.toLowerCase()).filter(value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)))],
    testPhones: [...new Set(items(input.phoneNumbers).filter(value => /^\+[1-9][0-9]{7,14}$/.test(value)))],
  };
}
