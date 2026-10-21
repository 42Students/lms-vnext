import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  AnnouncementAdminWorkspace,
  type AnnouncementAdminItem,
  type AnnouncementTarget,
} from "@/components/announcements/announcement-admin-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { Disclosure } from "@/components/ui/disclosure";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import {
  listAnnouncementsForAdmin,
  listAnnouncementTargetOptions,
} from "@/modules/announcements/service";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { getCollegeNoticeInbox } from "@/modules/announcements/college-notice-inbox-service";
import { collegeNoticeUnreadLabel } from "@/modules/announcements/college-notice-inbox-model";

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; beforeCreatedAt?: string; beforeId?: string; unread?: string }>;
}) {
  const context = await getCurrentRequestContext();
  const params = await searchParams;
  const ownInbox = await getCollegeNoticeInbox(context, {unreadOnly: params.unread ?? "0"});
  const unreadQuery = new URLSearchParams({
    ...(params.deleted === "1" ? {deleted:"1"} : {}),
    ...(params.unread === "1" ? {} : {unread:"1"}),
  });
  const unreadHref = "/college/announcements" + (unreadQuery.size ? "?" + unreadQuery.toString() : "");

  if (!announcementsRuntimeEnabled()) {
    return (
      <div className="min-w-0 overflow-x-clip space-y-6">
        <PageHeader
          title="Announcements"
          description="College-wide announcements are temporarily unavailable. Personal notifications are still available below."
        />
      <section aria-label="Personal college notifications" className="space-y-3 border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">Your college notifications</h2>
            <p className="mt-1 text-sm text-muted-foreground">{collegeNoticeUnreadLabel(ownInbox.unreadCount)}</p>
          </div>
          <Link href={unreadHref} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            {params.unread === "1" ? "Show all notifications" : "Unread only"}
          </Link>
        </div>
        <p className="text-sm text-body">These are persisted notifications addressed to your own account and associated with this college. They are not college-wide announcements or proof of message delivery to students or faculty.</p>
        {ownInbox.items.length === 0 ? <EmptyState title="No college notifications" description={params.unread === "1" ? "No unread notifications for your account in this college." : "No persisted notifications for your account in this college."}/>
          : <ul className="divide-y divide-border">{ownInbox.items.map(item => <li key={item.id} className="py-3">
            <p className="font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-body">{item.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-IN", {dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(item.createdAt))} · {item.readAt ? "Read" : "Unread"}</p>
            {item.actionHref ? <Link href={item.actionHref} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Open related page</Link> : null}
          </li>)}</ul>}
        <Link href="/notifications" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">{ownInbox.capped ? "View the full personal inbox (only 50 latest shown)" : "Open personal notifications"}</Link>
      </section>
        <Alert tone="warning" title="College-wide announcements are unavailable">
          You can still view your personal college notifications above. Creating and managing college-wide announcements is currently unavailable.
        </Alert>
      </div>
    );
  }

  const includeDeleted = params.deleted === "1";
  const [page, targetGroups] = await Promise.all([
    listAnnouncementsForAdmin(context, {
      includeDeleted,
      beforeCreatedAt: params.beforeCreatedAt,
      beforeId: params.beforeId,
      limit: 50,
    }),
    listAnnouncementTargetOptions(context),
  ]);

  const targets: AnnouncementTarget[] = targetGroups
    ? [
        ...targetGroups.college,
        ...targetGroups.departments,
        ...targetGroups.programs,
        ...targetGroups.classes,
        ...targetGroups.faculty,
        ...targetGroups.learners,
      ]
    : [];

  // Server component: evaluated once per request, so the request-time clock is intended.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  // Migration contract: legacy Announcement.createdAt was an IST local
  // datetime, converted ONCE to UTC using
  // legacyAnnouncementIstWallTimeToUtc before writing timestamptz.
  // Drizzle values are now real UTC instants; do not add +05:30 again here.
  const items: AnnouncementAdminItem[] = page.items.map((item) => ({
    id: item.id,
    receiverType: item.receiverType as AnnouncementAdminItem["receiverType"],
    receiverId: item.receiverId,
    title: item.title,
    message: item.message,
    senderType: item.senderType,
    scheduledAt: item.scheduledAt?.toISOString() ?? null,
    expiresAt: item.expiresAt?.toISOString() ?? null,
    isPinned: item.isPinned,
    deletedAt: item.deletedAt?.toISOString() ?? null,
    version: item.version,
    createdAt: item.createdAt.toISOString(),
    visibilityState: item.deletedAt
      ? "DELETED"
      : item.scheduledAt && item.scheduledAt.getTime() > now
        ? "SCHEDULED"
        : item.expiresAt && item.expiresAt.getTime() <= now
          ? "EXPIRED"
          : "LIVE",
  }));

  const next = page.nextCursor
    ? "/college/announcements?" + new URLSearchParams({
        ...(includeDeleted ? { deleted: "1" } : {}),
        ...(params.unread === "1" ? { unread: "1" } : {}),
        beforeCreatedAt: page.nextCursor.beforeCreatedAt.toISOString(),
        beforeId: page.nextCursor.beforeId,
      }).toString()
    : null;

  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
      <PageHeader
        title="Announcements"
        description="Target, schedule, pin, edit, soft-delete and restore college communications."
        actions={
          <Link
            href={includeDeleted ? "/college/announcements" : "/college/announcements?deleted=1"}
            className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
          >
            {includeDeleted ? "Active only" : "Include deleted"}
          </Link>
        }
      />

      <AnnouncementAdminWorkspace items={items} targets={targets} />
      {next ? (
        <div className="flex justify-center">
          <Link href={next} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Older announcements
          </Link>
        </div>
      ) : null}
      <Disclosure title="Your college notifications" className="min-w-0" contentClassName="min-w-0 pb-[var(--lms-space-4)]">
      <section aria-label="Personal college notifications" className="min-w-0 space-y-[var(--lms-space-3)] pt-[var(--lms-space-2)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          <Link href={unreadHref} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            {params.unread === "1" ? "Show all notifications" : "Unread only"}
          </Link>
        </div>
        <p className="text-sm text-body">These are persisted notifications addressed to your own account and associated with this college. They are not college-wide announcements or proof of message delivery to students or faculty.</p>
        {ownInbox.items.length === 0 ? <EmptyState title="No college notifications" description={params.unread === "1" ? "No unread notifications for your account in this college." : "No persisted notifications for your account in this college."}/>
          : <ul className="divide-y divide-border">{ownInbox.items.map(item => <li key={item.id} className="py-3">
            <p className="font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-body">{item.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-IN", {dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(item.createdAt))} · {item.readAt ? "Read" : "Unread"}</p>
            {item.actionHref ? <Link href={item.actionHref} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Open related page</Link> : null}
          </li>)}</ul>}
        <Link href="/notifications" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">{ownInbox.capped ? "View the full personal inbox (only 50 latest shown)" : "Open personal notifications"}</Link>
      </section>
      </Disclosure>

    </div>
  );
}
