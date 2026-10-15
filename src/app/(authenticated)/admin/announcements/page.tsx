import Link from "next/link";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/modules/identity/context";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  AnnouncementAdminWorkspace,
  type AnnouncementAdminItem,
  type AnnouncementTarget,
} from "@/components/announcements/announcement-admin-workspace";
import { PageHeader } from "@/components/ui/page-header";
import {SuperAdminCollegeBroadcastForm} from "@/components/announcements/super-admin-college-broadcast-form";
import {listSuperAdminBroadcastColleges} from "@/modules/announcements/super-admin-college-broadcast-service";
import {
  listAnnouncementsForAdmin,
  listAnnouncementTargetOptions,
} from "@/modules/announcements/service";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { parseSuperAdminAnnouncementParams } from "@/modules/announcements/super-admin-list-query";

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context) || context.user.platformStatus !== "ACTIVE") {
    redirect("/dashboard");
  }
  const params = parseSuperAdminAnnouncementParams(await searchParams);
  if (!params) {
    return <div className="space-y-5">
      <PageHeader eyebrow="Super Admin" title="Announcements" description="Review and publish college notices." />
      <p role="alert" className="rounded-xl border border-border bg-surface p-5">Invalid announcement filters or pagination cursor. <Link href="/admin/announcements" className="font-semibold text-primary-text underline">Reset filters</Link></p>
    </div>;
  }

  if (!announcementsRuntimeEnabled()) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin"
          title="Announcements"
          description="Migration 0076 registers the announcement tables; this environment has not enabled the verified DB10 runtime flag."
        />
        <div role="status" className="rounded-xl border border-border bg-surface p-6">
          <p className="m-0 font-semibold text-foreground">Announcements database is not enabled.</p>
          <p className="mt-2 text-sm text-body">Apply and verify migration 0076, then explicitly set DB10_ANNOUNCEMENTS_READY=DB10_VERIFIED. No announcement DB reads or writes are attempted while disabled.</p>
        </div>
      </div>
    );
  }

  const includeDeleted = params.deleted === "1";
  const [page, targetGroups, broadcastColleges] = await Promise.all([
    listAnnouncementsForAdmin(context, {
      includeDeleted,
      q: params.q,
      receiverType: params.receiverType,
      beforeCreatedAt: params.beforeCreatedAt,
      beforeId: params.beforeId,
      limit: 50,
    }),
    listAnnouncementTargetOptions(context),
    listSuperAdminBroadcastColleges(context),
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
        ...(params.q ? { q: params.q } : {}),
        ...(params.receiverType ? {receiverType:params.receiverType} : {}),
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
            href={"/admin/announcements?" + new URLSearchParams({ ...(includeDeleted ? {} : {deleted:"1"}), ...(params.q ? {q:params.q} : {}), ...(params.receiverType ? {receiverType:params.receiverType} : {}) }).toString()}
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-foreground"
          >
            {includeDeleted ? "Active only" : "Include deleted"}
          </Link>
        }
      />
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        {includeDeleted ? <input type="hidden" name="deleted" value="1"/> : null}
        <label className="text-sm font-semibold text-body">Audience type
          <select name="receiverType" defaultValue={params.receiverType ?? ""} className="mt-1 min-h-11 rounded-md border border-border bg-surface px-3">
            <option value="">All audiences</option>
            {(["COLLEGE","PROGRAM","DEPARTMENT","CLASS","LEARNER","FACULTY"] as const).map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="min-w-[14rem] flex-1 text-sm font-semibold text-body">Search announcement title or message
          <input name="q" defaultValue={params.q ?? ""} maxLength={120} placeholder="Literal phrase" className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground"/>
        </label>
        <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Search</button>
        <Link href="/admin/announcements" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm">Clear</Link>
      </form>
      <SuperAdminCollegeBroadcastForm colleges={broadcastColleges}/>
      <AnnouncementAdminWorkspace items={items} targets={targets} requiresPublicationConsent/>
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
