import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import { LearnerPlacementsTabs } from "@/components/placements/learner-placements-tabs";
import { getUnreadOwnLearnerPlacementAlertCount } from "@/modules/placements/learner-placement-alerts-service";
import { readOptionalLearnerPlacementSource } from "@/modules/placements/learner-optional-placement-source";

/**
 * Direct links are subject to the same college-level paid module +
 * member/class/cohort participation gate as the navigation sidebar.
 * Do not expose private eligibility status/reason via route errors.
 * Infrastructure faults still propagate instead of being shown as fake 404s.
 */
export default async function LearnerPlacementsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const context = await getCurrentRequestContext();
  try {
    await requireLearnerPlacementAccess(context);
  } catch (error) {
    if (error instanceof AuthorizationError) notFound();
    throw error;
  }
  const unread=await readOptionalLearnerPlacementSource(
    ()=>getUnreadOwnLearnerPlacementAlertCount(context));
  return (
    <div className="space-y-6">
      <LearnerPlacementsTabs unreadPersonalAlerts={unread.available?unread.value:null} />
      {children}
    </div>
  );
}
