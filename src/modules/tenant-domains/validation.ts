import { isIP } from "node:net";
import { z } from "zod";

export function normalizeTenantHost(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    throw new Error("Host is required");
  }

  if (
    trimmed.includes("://") ||
    // URL canonicalization strips the default HTTPS port 443 before the
    // parsed.port check; configured tenant domains must never include ports.
    trimmed.includes(":") ||
    /[/?#@]/.test(trimmed) ||
    /[\\\x00-\x1f\x7f]/.test(trimmed)
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
  if (!trimmed || trimmed.includes("://") || /[/?#@]/.test(trimmed) || /[\\\x00-\x1f\x7f]/.test(trimmed)) {
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
  isPrimary:z.boolean().optional().default(false),
});

export const tenantDomainActionSchema = z.object({
  action: z.literal("SET_PRIMARY"),
});

export type CreateTenantDomainInput = z.infer<
  typeof createTenantDomainInputSchema
>;

/** Legacy TenantAdminController conflict vocabulary and actionable guidance.
 * The registered domain-service must continue enforcing the UNIQUE host
 * claim and verified-before-primary rule; mapping text is never a permission
 * or validation bypass. */
export function tenantDomainLegacyConflict(errorCode: string):
  {status:409;error:"HOST_ALREADY_EXISTS"|"DOMAIN_NOT_VERIFIED";message:string}|null {
 if(errorCode==="HOST_CONFLICT"||errorCode==="HOST_ALREADY_EXISTS")
  return {status:409,error:"HOST_ALREADY_EXISTS",
   message:"This address is already registered to another college."};
 if(errorCode==="DOMAIN_NOT_VERIFIED")
  return {status:409,error:"DOMAIN_NOT_VERIFIED",
   message:"Verify this address before making it the main one."};
 return null;
}

// Primary selection is a two-phase workflow, never a blind create flag.
// An unverified domain cannot become primary until its DNS claim is proven.
export function tenantDomainPrimaryNextStep(input:{isPrimary:boolean;domainId:string;verified:boolean}){
 return input.isPrimary&&!input.verified?{
  action:"VERIFY_THEN_SET_PRIMARY" as const,
  verifyHref:"/api/tenant-domains/"+encodeURIComponent(input.domainId)+"/verify",
  primaryHref:"/api/tenant-domains/"+encodeURIComponent(input.domainId),
 }:null;
}
