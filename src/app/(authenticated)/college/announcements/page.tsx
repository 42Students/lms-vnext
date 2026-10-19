import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  AnnouncementAdminWorkspace,
  type AnnouncementAdminItem,
  type AnnouncementTarget,
} from "@/components/announcements/announcement-admin-workspace";
import { PageHeader } from "@/components/ui/page-header";
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
          eyebrow="College Admin"
          title="Announcements"
          description="Scheduling and audience management are staged, but DB10 announcement migrations are not verified yet."
        />
      <section aria-label="Personal college notifications" className="space-y-3 border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Your college notifications</h2>
            <p className="mt-1 text-sm text-muted-foreground">{collegeNoticeUnreadLabel(ownInbox.unreadCount)}</p>
          </div>
          <Link href={unreadHref} className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius,9px)] border border-[var(--lms-canvas-border)] px-3 text-sm font-semibold text-[var(--lms-link-text)]">
            {params.unread === "1" ? "Show all notifications" : "Unread only"}
          </Link>
        </div>
        <p className="text-sm text-body">These are persisted notifications addressed to your own account and associated with this college. They are not college-wide announcements or proof of message delivery to students or faculty.</p>
        {ownInbox.items.length === 0 ? <p className="text-sm text-muted-foreground">{params.unread === "1" ? "No unread notifications for your account in this college." : "No persisted notifications for your account in this college."}</p>
          : <ul className="divide-y divide-border">{ownInbox.items.map(item => <li key={item.id} className="border-b border-border py-3">
            <p className="font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-body">{item.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-IN", {dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(item.createdAt))} · {item.readAt ? "Read" : "Unread"}</p>
            {item.actionHref ? <Link href={item.actionHref} className="inline-flex min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-[var(--lms-link-text)]">Open related page</Link> : null}
          </li>)}</ul>}
        <Link href="/notifications" className="inline-flex min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-[var(--lms-link-text)] hover:underline">{ownInbox.capped ? "View the full personal inbox (only 50 latest shown)" : "Open personal notifications"}</Link>
      </section>
        <div role="status" className="rounded-[8px] border border-border bg-surface p-6">
          <p className="m-0 font-semibold text-foreground">Announcements database is not enabled.</p>
          <p className="mt-2 text-sm text-body">The college-wide announcements table is not registered; no broadcast announcement reads or writes are attempted. Personal notifications above are stored separately in the registered inbox.</p>
        </div>
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title="Announcements"
        description="Target, schedule, pin, edit, soft-delete and restore college communications."
        actions={
          <Link
            href={includeDeleted ? "/college/announcements" : "/college/announcements?deleted=1"}
            className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius,9px)] border border-[var(--lms-canvas-border)] px-4 text-sm font-semibold text-foreground"
          >
            {includeDeleted ? "Active only" : "Include deleted"}
          </Link>
        }
      />
      <section aria-label="Personal college notifications" className="space-y-3 border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Your college notifications</h2>
          <Link href={unreadHref} className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius,9px)] border border-[var(--lms-canvas-border)] px-3 text-sm font-semibold text-[var(--lms-link-text)]">
            {params.unread === "1" ? "Show all notifications" : "Unread only"}
          </Link>
        </div>
        <p className="text-sm text-body">These are persisted notifications addressed to your own account and associated with this college. They are not college-wide announcements or proof of message delivery to students or faculty.</p>
        {ownInbox.items.length === 0 ? <p className="text-sm text-muted-foreground">{params.unread === "1" ? "No unread notifications for your account in this college." : "No persisted notifications for your account in this college."}</p>
          : <ul className="divide-y divide-border">{ownInbox.items.map(item => <li key={item.id} className="border-b border-border py-3">
            <p className="font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-body">{item.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-IN", {dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(item.createdAt))} · {item.readAt ? "Read" : "Unread"}</p>
            {item.actionHref ? <Link href={item.actionHref} className="inline-flex min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-[var(--lms-link-text)]">Open related page</Link> : null}
          </li>)}</ul>}
        <Link href="/notifications" className="inline-flex min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-[var(--lms-link-text)] hover:underline">{ownInbox.capped ? "View the full personal inbox (only 50 latest shown)" : "Open personal notifications"}</Link>
      </section>
      <AnnouncementAdminWorkspace items={items} targets={targets} />
      {next ? (
        <div className="flex justify-center">
          <Link href={next} className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius,9px)] border border-[var(--lms-canvas-border)] bg-[var(--lms-surface)] px-4 text-sm font-semibold text-foreground">
            Older announcements
          </Link>
        </div>
      ) : null}
    </div>
  );
}
