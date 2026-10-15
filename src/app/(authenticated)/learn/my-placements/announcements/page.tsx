import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { listVisibleAnnouncementsForMembership } from "@/modules/announcements/service";
import { learnerPlacementNoticeFeed } from "@/modules/placements/learner-placement-announcement-model";

export default async function LearnerPlacementAnnouncementsPage() {
  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context, "LEARNER")) throw new AuthorizationError("placements.read");
  const own = await requireLearnerPlacementAccess(context);
  requirePermission(context, "placements.read", {
    collegeId: own.collegeId, organizationId: own.organizationId,
  });
  // DB10 is an optional registered migration. Never query staged tables when disabled.
  const ready = announcementsRuntimeEnabled();
  const notices = ready
    ? learnerPlacementNoticeFeed(await listVisibleAnnouncementsForMembership(context))
    : [];
  return (
    <main className="min-w-0 space-y-6">
      <div>
        <Link href="/learn/my-placements" className="text-sm text-primary-text underline">Back to My Placements</Link>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">Announcements</h1>
        <p className="mt-2 text-sm text-body">Read-only notices visible to your own college membership.</p>
      </div>
      {!ready ? (
        <div role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
          College announcements are not available until the announcements database is enabled.
        </div>
      ) : notices.length === 0 ? (
        <p role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
          No current notices are visible to your membership.
        </p>
      ) : (
        <ul className="min-w-0 space-y-3">
          {notices.map((notice) => (
            <li key={notice.id} className="min-w-0 rounded-xl border border-border bg-surface p-5">
              {notice.isPinned ? <p className="text-xs font-semibold text-primary-text">Pinned</p> : null}
              <h2 className="break-words text-lg font-semibold text-foreground">{notice.title}</h2>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{notice.message}</p>
              <time dateTime={notice.createdAt} className="mt-3 block text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" }).format(new Date(notice.createdAt))}
              </time>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
