import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import {
  createPlacementCompany,findSamePlacementCompanyByName,loadPlacementCompanyIdentity,
  placementCompanyIdentityMatches,
} from "@/modules/placements/company-service";
import { tpoCreateCompanySchema,tpoDistinctCompanyReviewSchema } from "@/modules/placements/tpo-company-create-model";
import { recordActivityEvent } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
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
    // A validated work email can provide the domain for a new employer.
    // Never infer a domain from an unvalidated, personal or disposable address.
    const email = typeof raw.recruiterEmail === "string" ? raw.recruiterEmail.trim().toLowerCase() : "";
    const derivedDomain = email.includes("@") ? email.split("@")[1] : undefined;
    const withDomain: Record<string, unknown> = {
      ...raw,
      ...(!raw.primaryDomain && derivedDomain ? { primaryDomain: derivedDomain } : {}),
    };
    // Distinct-company review fields are validated separately (below) and are
    // not part of the base create contract.
    const {
      reviewedCompanyId: _reviewedId, reviewedCompanyDomain: _reviewedDomain,
      distinctCompanyReason: _reviewReason, ...baseRaw
    } = withDomain;
    void _reviewedId; void _reviewedDomain; void _reviewReason;
    const parsed = tpoCreateCompanySchema.parse(baseRaw);
    const { confirmed: _confirmed, recruiterEmail, notTheSame, ...input } = parsed;
    void _confirmed;
    const claimedDomain = input.primaryDomain ??
      (input.websiteUrl ? new URL(input.websiteUrl).hostname.replace(/^www\./i, "") : "");
    if (recruiterEmail && !matchesCompanyDomain(recruiterEmail, claimedDomain)) {
      return NextResponse.json({
        error: "RECRUITER_EMAIL_DOMAIN_MISMATCH",
        message: "Use a recruiter email from the company domain.",
      }, { status: 422 });
    }
    // Legacy "Add other": a company already on the list with the same name but
    // a different domain is offered as "Use <company>" (SAME_COMPANY) unless the
    // TPO explicitly confirms it is a different company, with a written reason.
    let distinctReview: { reviewedCompanyId: string; reason: string } | null = null;
    if (!notTheSame) {
      const same = await findSamePlacementCompanyByName(input.name, claimedDomain);
      if (same) {
        return NextResponse.json({
          error: "SAME_COMPANY",
          companyId: same.id,
          name: same.name,
          primaryDomain: same.primaryDomain,
          message: same.name + " is already on the list. Use it, or confirm it is a different company.",
        }, { status: 409 });
      }
    } else {
      const review = tpoDistinctCompanyReviewSchema.safeParse(withDomain);
      if (!review.success) {
        return NextResponse.json({
          error: "DISTINCT_COMPANY_REVIEW_REQUIRED",
          message: review.error.issues[0]?.message ??
            "Confirm the matching company and explain why this is a different company.",
        }, { status: 422 });
      }
      // Re-read the reviewed identity on the server; the client boolean alone
      // never bypasses the global identity checks (domain uniqueness is still
      // enforced inside createPlacementCompany).
      const reviewed = await loadPlacementCompanyIdentity(review.data.reviewedCompanyId);
      if (!reviewed || !placementCompanyIdentityMatches(
        reviewed, input.name, review.data.reviewedCompanyDomain)) {
        return NextResponse.json({
          error: "DISTINCT_COMPANY_REVIEW_STALE",
          message: "The matching company changed. Search again before creating a different company.",
        }, { status: 409 });
      }
      distinctReview = {
        reviewedCompanyId: reviewed.id, reason: review.data.distinctCompanyReason,
      };
    }
    const result = await createPlacementCompany(context, {
      ...input, collegeId, isTrusted: false,
    });
    if (distinctReview) {
      await recordActivityEvent(context, {
        eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_UPDATED,
        collegeId,
        subjectType: "placement_company",
        subjectId: result.company.id,
        subjectLabel: result.company.name,
        summary: "Company confirmed as different from an existing employer",
        metadata: {
          reviewedCompanyId: distinctReview.reviewedCompanyId,
          reason: distinctReview.reason,
          action: "DISTINCT_COMPANY_CONFIRMED",
        },
        groupKey: "placement-companies:" + collegeId,
      });
    }
    return NextResponse.json({
      companyId: result.company.id,
      relationshipId: result.relationship.id,
      companyName: result.company.name,
      name: result.company.name,
      logoUrl: result.company.logoPublicUrl ?? null,
      verifiedBy42: Boolean(result.company.verifiedAt),
      existed: result.existed,
      nameLocked:result.existed||Boolean(result.company.verifiedAt),
      matchedExistingCompany:result.existed,
      collegeAlreadyLinked:result.alreadyLinked,
      relationshipRestored:result.existed&&!result.alreadyLinked,
      company:{
        id:result.company.id,name:result.company.name,
        primaryDomain:result.company.primaryDomain,
        verifiedBy42:Boolean(result.company.verifiedAt),
      },
      relationship:{id:result.relationship.id,
        collegeId:result.relationship.collegeId,
        status:result.relationship.status},
      identityDecision:result.existed?"MATCHED":"NEW",
      actorAttribution:{userId:context.user.id,mode:"SCOPED_TPO"},
      message:result.alreadyLinked?"Company is already linked to your college.":
        result.existed?"Existing company linked to your college.":"Company created and linked to your college.",
    }, { status: result.existed ? 200 : 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
