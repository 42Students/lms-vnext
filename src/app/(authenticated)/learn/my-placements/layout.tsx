import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { SessionAuthenticationError } from "@/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import { LearnerPlacementsTabs } from "@/components/placements/learner-placements-tabs";
import { getUnreadOwnLearnerPlacementAlertCount } from "@/modules/placements/learner-placement-alerts-service";
import { readOptionalLearnerPlacementSource } from "@/modules/placements/learner-optional-placement-source";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { listVisibleAnnouncementsForMembership } from "@/modules/announcements/service";
import { learnerPlacementNoticeFeed } from "@/modules/placements/learner-placement-announcement-model";

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
  // The historical placement shell sent signed-out learners home; never
  // redirect a signed-in member with a denied college/module scope.
  const context = await getCurrentRequestContext().catch(error => {
    if (error instanceof SessionAuthenticationError) redirect("/");
    throw error;
  });
  try {
    await requireLearnerPlacementAccess(context);
  } catch (error) {
    if (error instanceof AuthorizationError) notFound();
    throw error;
  }
  const [unreadPersonal, unreadCollege] = await Promise.all([
    readOptionalLearnerPlacementSource(
      () => getUnreadOwnLearnerPlacementAlertCount(context)),
    announcementsRuntimeEnabled()
      ? readOptionalLearnerPlacementSource(async () => {
          const visible = learnerPlacementNoticeFeed(
            await listVisibleAnnouncementsForMembership(context));
          // A college-wide feed with missing read receipts must not
          // be displayed as zero unread.
          return visible.every(item => item.unread !== null)
            ? visible.filter(item => item.unread === true).length
            : null;
        })
      : Promise.resolve({ available: false as const, value: null }),
  ]);
  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
      <PageHeader title="My Placements" />
      <LearnerPlacementsTabs
        unreadPersonalAlerts={unreadPersonal.available ? unreadPersonal.value : null}
        unreadCollegeAnnouncements={unreadCollege.available ? unreadCollege.value : null}
      />
      {children}
    </div>
  );
}
