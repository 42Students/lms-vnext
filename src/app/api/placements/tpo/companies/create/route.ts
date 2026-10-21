import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { createPlacementCompany } from "@/modules/placements/company-service";
import { tpoCreateCompanySchema } from "@/modules/placements/tpo-company-create-model";
import { matchesCompanyDomain } from "@/modules/placements/public-join/domain-model";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    if (!context.membership || !hasMembershipRole(context, "TPO")) {
      throw new AuthorizationError("placements.manage");
    }
    const collegeId = context.membership.collegeId;
    if (!can(context, "placements.manage", { collegeId })) {
      throw new AuthorizationError("placements.manage");
    }
    requirePermission(context, "placements.manage", { collegeId });
    await requirePlacementManageScope(context, collegeId);
    const body: unknown = await request.json();
    const raw = body && typeof body === "object" && !Array.isArray(body)
      ? body as Record<string, unknown> : {};
    // A verified recruiter email can provide the domain for a new employer.
    // Never infer a domain from an unvalidated, personal or disposable address.
    const email = typeof raw.recruiterEmail === "string" ? raw.recruiterEmail.trim().toLowerCase() : "";
    const derivedDomain = email.includes("@") ? email.split("@")[1] : undefined;
    const parsed = tpoCreateCompanySchema.parse({
      ...raw,
      ...(!raw.primaryDomain && derivedDomain ? { primaryDomain: derivedDomain } : {}),
    });
    const { confirmed: _confirmed, recruiterEmail, notTheSame, ...input } = parsed;
    void _confirmed;
    const claimedDomain = input.primaryDomain ??
      (input.websiteUrl ? new URL(input.websiteUrl).hostname.replace(/^www\\./i, "") : "");
    if (recruiterEmail && !matchesCompanyDomain(recruiterEmail, claimedDomain)) {
      return NextResponse.json({
        error: "RECRUITER_EMAIL_DOMAIN_MISMATCH",
        message: "Use a recruiter email from the company domain.",
      }, { status: 422 });
    }
    // A differing-company override needs an approved reviewed-company identity,
    // not just a client-supplied boolean that bypasses global identity checks.
    if (notTheSame) {
      return NextResponse.json({
        error: "DISTINCT_COMPANY_REVIEW_REQUIRED",
        message: "Confirm the matching company before creating a different one.",
      }, { status: 409 });
    }
    const result = await createPlacementCompany(context, {
      ...input, collegeId, isTrusted: false,
    });
    return NextResponse.json({
      companyId: result.company.id,
      relationshipId: result.relationship.id,
      companyName: result.company.name,
      name: result.company.name,
      logoUrl: result.company.logoPublicUrl ?? null,
      verifiedBy42: Boolean(result.company.verifiedAt),
      existed: result.existed,
      nameLocked: result.existed || Boolean(result.company.verifiedAt),
    }, { status: result.existed ? 200 : 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
