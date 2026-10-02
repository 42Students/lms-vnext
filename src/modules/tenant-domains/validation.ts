import { isIP } from "node:net";
import { z } from "zod";

export function normalizeTenantHost(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    throw new Error("Host is required");
  }

  if (
    trimmed.includes("://") ||
    /[/?#@]/.test(trimmed)
  ) {
    throw new Error("Host must be a hostname, not a URL");
  }

  const withoutTrailingDot = trimmed.replace(/\.+$/, "");
  if (!withoutTrailingDot) {
    throw new Error("Host is required");
  }

  let parsed: URL;
  try {
    parsed = new URL(`https://${withoutTrailingDot}`);
  } catch {
    throw new Error("Host is invalid");
  }

  if (parsed.port) {
    throw new Error("Configured tenant host must not include a port");
  }

  const host = parsed.hostname.toLowerCase().replace(/\.+$/, "");

  if (
    host.length > 253 ||
    !host.includes(".") ||
    host === "localhost" ||
    isIP(host) !== 0
  ) {
    throw new Error("Host must be a fully-qualified DNS hostname");
  }

  const labels = host.split(".");
  if (
    labels.some(
      (label) =>
        label.length === 0 ||
        label.length > 63 ||
        !/^[a-z0-9-]+$/.test(label) ||
        label.startsWith("-") ||
        label.endsWith("-"),
    )
  ) {
    throw new Error("Host contains an invalid DNS label");
  }

  return host;
}

export function normalizeRequestHost(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed || trimmed.includes("://") || /[/?#@]/.test(trimmed)) {
    throw new Error("Request host is invalid");
  }

  let parsed: URL;
  try {
    parsed = new URL(`http://${trimmed}`);
  } catch {
    throw new Error("Request host is invalid");
  }

  return normalizeTenantHost(parsed.hostname);
}

function normalizedHostSchema() {
  return z.string().transform((value, context) => {
    try {
      return normalizeTenantHost(value);
    } catch (error) {
      context.addIssue({
        code: "custom",
        message:
          error instanceof Error ? error.message : "Host is invalid",
      });
      return z.NEVER;
    }
  });
}

export const tenantDomainHostSchema = normalizedHostSchema();
export const tenantDomainIdSchema = z.string().uuid();
export const tenantDomainCollegeIdSchema = z.string().uuid();

export const createTenantDomainInputSchema = z.object({
  collegeId: tenantDomainCollegeIdSchema,
  host: tenantDomainHostSchema,
});

export const tenantDomainActionSchema = z.object({
  action: z.literal("SET_PRIMARY"),
});

export type CreateTenantDomainInput = z.infer<
  typeof createTenantDomainInputSchema
>;
