import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges } from "@/db/schema";
import {
  publicRequestTenantSnapshot,
  resolveRequestTenant,
} from "@/modules/auth/request-tenant";
import { getPublicCollegeBranding } from "@/modules/colleges/branding-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  Vary: "Host",
};

/**
 * Versioned read-only compatibility entrypoint for old /api/v1/public/
 * tenant-bootstrap consumers. Identifiers in version 2 are UUIDs, never
 * coerced legacy numeric IDs; old clients must inspect idFormat before use.
 * Tenant identity comes exclusively from the verified request Host.
 */
export async function GET(request: Request) {
  const hostHeader = request.headers.get("host");
  const tenant = await resolveRequestTenant(hostHeader);
  const localHost = (hostHeader ?? "").trim().toLowerCase().replace(/:\\d+$/, "");
  const localDevelopment =
    process.env.NODE_ENV === "development" &&
    (localHost === "localhost" || localHost === "127.0.0.1" || localHost === "[::1]");

  if (tenant.kind === "platform" || localDevelopment) {
    return Response.json({
      version: 2,
      mode: "GLOBAL",
      idFormat: "uuid",
      globalHost: tenant.kind === "platform" ? tenant.host : "localhost",
      baseDomain: "42lms.com",
      collegeId: null,
      organizationId: null,
    }, { headers });
  }
  if (tenant.kind === "unknown") {
    return Response.json({
      error: "TENANT_NOT_FOUND",
      message: "This domain is not configured",
    }, { status: 404, headers });
  }
  if (tenant.kind === "unavailable") {
    return Response.json({
      error: "TENANT_UNAVAILABLE",
      message: "College settings are temporarily unavailable",
    }, { status: 503, headers });
  }

  try {
    // Verify the college is still active and load only its public legacy key.
    // Do not construct a tenant key from its UUID or code as a guess.
    const [college] = await getDb().select({
      name: colleges.name,
      legacyUniqueId: colleges.legacyUniqueId,
      status: colleges.status,
    }).from(colleges).where(eq(colleges.id, tenant.collegeId)).limit(1);
    if (!college || college.status !== "ACTIVE") {
      return Response.json({
        error: "TENANT_NOT_FOUND",
        message: "This domain is not configured",
      }, { status: 404, headers });
    }
    const branding = await getPublicCollegeBranding(tenant.collegeId);
    if (!branding) {
      return Response.json({
        error: "TENANT_NOT_FOUND",
        message: "This domain is not configured",
      }, { status: 404, headers });
    }

    const verified = publicRequestTenantSnapshot(tenant);
    return Response.json({
      version: 2,
      mode: "TENANT",
      idFormat: "uuid",
      baseDomain: "42lms.com",
      requestHost: tenant.host,
      tenantKey: college.legacyUniqueId ?? null,
      collegeId: verified.collegeId,
      organizationId: verified.organizationId,
      collegeName: college.name,
      canonicalHost: verified.canonicalHost,
      shouldRedirectToCanonicalHost: verified.redirectToCanonical,
      logoUrl: branding.logoUrl,
      faviconUrl: branding.faviconUrl,
      loginBackgroundUrl: branding.loginBackgroundUrl,
      loginBackgroundUrlMobile: branding.loginBackgroundUrlMobile,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      loginMethods: branding.loginMethods,
      supportEmail: branding.supportEmail,
      supportPhone: branding.supportPhone,
      termsUrl: branding.termsUrl,
      privacyUrl: branding.privacyUrl,
    }, { headers });
  } catch {
    // An unavailable verified tenant is never reported as a healthy GLOBAL
    // fallback, nor does a failed sign-in policy enable every OTP channel.
    return Response.json({
      error: "TENANT_UNAVAILABLE",
      message: "College settings are temporarily unavailable",
    }, { status: 503, headers });
  }
}
