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

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; beforeCreatedAt?: string; beforeId?: string }>;
}) {
  const context = await getCurrentRequestContext();
  const params = await searchParams;

  if (!announcementsRuntimeEnabled()) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin"
          title="Announcements"
          description="Scheduling and audience management are staged, but DB10 announcement migrations are not verified yet."
        />
        <div role="status" className="rounded-xl border border-border bg-surface p-6">
          <p className="m-0 font-semibold text-foreground">Announcements database is not enabled.</p>
          <p className="mt-2 text-sm text-body">W01 must promote and replay the DB10 announcement table before this page performs any DB reads or writes.</p>
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
    ? "/admin/announcements?" + new URLSearchParams({
        ...(includeDeleted ? { deleted: "1" } : {}),
        beforeCreatedAt: page.nextCursor.beforeCreatedAt.toISOString(),
        beforeId: page.nextCursor.beforeId,
      }).toString()
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Announcements"
        description="Target, schedule, pin, edit, soft-delete and restore college communications."
        actions={
          <Link
            href={includeDeleted ? "/admin/announcements" : "/admin/announcements?deleted=1"}
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-foreground"
          >
            {includeDeleted ? "Active only" : "Include deleted"}
          </Link>
        }
      />
      <AnnouncementAdminWorkspace items={items} targets={targets} />
      {next ? (
        <div className="flex justify-center">
          <Link href={next} className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground">
            Older announcements
          </Link>
        </div>
      ) : null}
    </div>
  );
}
