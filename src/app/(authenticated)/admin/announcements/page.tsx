import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
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
import {getSuperAdminBroadcastReceiptCounts} from "@/modules/announcements/super-admin-broadcast-receipts-service";
import {listSuperAdminBroadcastColleges} from "@/modules/announcements/super-admin-college-broadcast-service";
import {
  listAnnouncementsForAdmin,
  listAnnouncementTargetOptions,
} from "@/modules/announcements/service";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { parseSuperAdminAnnouncementParams } from "@/modules/announcements/super-admin-list-query";
import { announcementVisibilityAt } from "@/modules/announcements/visibility-model";
import {announcementHistoryEmptyMessage} from "@/modules/announcements/admin-history-empty-model";
import { ANNOUNCEMENT_SENDER_TYPES } from "@/modules/announcements/validation";

function currentTimeMs() {
  return Date.now();
}

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
    return <div className="min-w-0 space-y-5">
      <PageHeader eyebrow="Super Admin" title="Announcements" description="Review and publish college notices." />
      <p role="alert" className="rounded-[var(--lms-control-radius)] border border-border bg-primary-subtle p-4 text-body">Invalid announcement filters or pagination cursor. <Link href="/admin/announcements" className="font-semibold text-primary-text underline">Reset filters</Link></p>
    </div>;
  }

  if (!announcementsRuntimeEnabled()) {
    return (
      <div className="min-w-0 space-y-6">
        <PageHeader
          eyebrow="Super Admin"
          title="Announcements"
          description="Migration 0076 registers the announcement tables; this environment has not enabled the verified DB10 runtime flag."
        />
        <div role="status" className="rounded-[var(--lms-control-radius)] border border-border bg-primary-subtle p-4">
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
      visibility: params.visibility,
      pinned: params.pinned,
      senderType: params.senderType,
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

  const now = currentTimeMs();
  const items: AnnouncementAdminItem[] = page.items.map((item) => ({
    id: item.id,
    receiverType: item.receiverType as AnnouncementAdminItem["receiverType"],
    receiverId: item.receiverId,
    title: item.title,
    message: item.message,
    buttonLabel:item.buttonLabel,
    buttonUrl:item.buttonUrl,
    senderType: item.senderType,
    scheduledAt: item.scheduledAt?.toISOString() ?? null,
    expiresAt: item.expiresAt?.toISOString() ?? null,
    isPinned: item.isPinned,
    deletedAt: item.deletedAt?.toISOString() ?? null,
    version: item.version,
    createdAt: item.createdAt.toISOString(),
    visibilityState: announcementVisibilityAt(item, now),
  }));

  const receipts=await getSuperAdminBroadcastReceiptCounts(context,page.items.filter(x=>x.senderType==="SUPER_ADMIN"&&x.receiverType==="COLLEGE").map(x=>x.id));
  const next = page.nextCursor
    ? "/admin/announcements?" + new URLSearchParams({
        ...(includeDeleted ? { deleted: "1" } : {}),
        ...(params.q ? { q: params.q } : {}),
        ...(params.receiverType ? {receiverType:params.receiverType} : {}),
        ...(params.visibility ? {visibility:params.visibility} : {}),
        ...(params.pinned ? {pinned:params.pinned} : {}),
        ...(params.senderType ? {senderType:params.senderType} : {}),
        beforeCreatedAt: page.nextCursor.beforeCreatedAt.toISOString(),
        beforeId: page.nextCursor.beforeId,
      }).toString()
    : null;

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Announcements"
        description="Target, schedule, pin, edit, soft-delete and restore college communications."
        actions={
          <Link
            href={"/admin/announcements?" + new URLSearchParams({ ...(includeDeleted ? {} : {deleted:"1"}), ...(params.q ? {q:params.q} : {}), ...(params.receiverType ? {receiverType:params.receiverType} : {}), ...(params.visibility ? {visibility:params.visibility} : {}), ...(params.pinned ? {pinned:params.pinned} : {}), ...(params.senderType ? {senderType:params.senderType} : {}) }).toString()}
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-foreground sm:min-h-9"
          >
            {includeDeleted ? "Active only" : "Include deleted"}
          </Link>
        }
      />
      <form method="get" className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
        {includeDeleted ? <input type="hidden" name="deleted" value="1"/> : null}
        <label className="text-sm font-semibold text-body">Visibility
          <Select name="visibility" defaultValue={params.visibility ?? ""} className="mt-1">
            <option value="">All visible states</option>
            <option value="LIVE">Live</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="EXPIRED">Expired</option>
            <option value="DELETED">Deleted only</option>
          </Select>
        </label>
        <label className="text-sm font-semibold text-body">Pinned
          <Select name="pinned" defaultValue={params.pinned ?? ""} className="mt-1">
            <option value="">All notices</option><option value="PINNED">Pinned only</option><option value="UNPINNED">Not pinned</option>
          </Select>
        </label>
        <label className="text-sm font-semibold text-body">Published by
          <Select name="senderType" defaultValue={params.senderType ?? ""} className="mt-1">
            <option value="">All senders</option>{ANNOUNCEMENT_SENDER_TYPES.map(type=><option key={type} value={type}>{type}</option>)}
          </Select>
        </label>
        <label className="text-sm font-semibold text-body">Audience type
          <Select name="receiverType" defaultValue={params.receiverType ?? ""} className="mt-1">
            <option value="">All audiences</option>
            {(["COLLEGE","PROGRAM","DEPARTMENT","CLASS","LEARNER","FACULTY"] as const).map(type => <option key={type} value={type}>{type}</option>)}
          </Select>
        </label>
        <label className="min-w-[14rem] flex-1 text-sm font-semibold text-body">Search announcement title or message
          <Input name="q" defaultValue={params.q ?? ""} maxLength={120} placeholder="Search title or message" className="mt-1 w-full"/>
        </label>
        <Button type="submit">Search</Button>
        <Link href="/admin/announcements" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm text-primary-text hover:bg-primary-subtle sm:min-h-9">Clear</Link>
      </form>
      <Link href={"/api/admin/announcements/export?" + new URLSearchParams({
        ...(includeDeleted ? {deleted:"1"} : {}),
        ...(params.q ? {q:params.q} : {}),
        ...(params.receiverType ? {receiverType:params.receiverType} : {}),
        ...(params.visibility ? {visibility:params.visibility} : {}),
        ...(params.pinned ? {pinned:params.pinned} : {}),
        ...(params.senderType ? {senderType:params.senderType} : {}),
        ...(params.beforeCreatedAt ? {beforeCreatedAt:params.beforeCreatedAt} : {}),
        ...(params.beforeId ? {beforeId:params.beforeId} : {}),
      }).toString()} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text sm:min-h-9">Export this filtered page (CSV)</Link>
      <SuperAdminCollegeBroadcastForm colleges={broadcastColleges}/>
      {receipts.size?<section aria-label="Placement-cell read receipts" className="min-w-0 space-y-3 border-t border-border pt-5">
       <h2 className="text-lg font-semibold">Placement-cell read receipts</h2>
       <p className="text-sm text-muted-foreground">Durable first-read receipts for each selected college notice. Each notice is addressed to one placement cell; notification delivery is shown separately, and only an explicit acknowledgement counts as a placement-cell read.</p>
       <ul className="min-w-0 space-y-2">{page.items.filter(row=>receipts.has(row.id)).map(row=>{
        const receipt=receipts.get(row.id)!;
        return <li key={row.id} className="rounded-lg border border-border p-3 text-sm">
         <p className="font-semibold">{row.title}</p><p className="text-muted-foreground">{receipt.cellRead} of 1 placement cell read · {receipt.read}/{receipt.delivered} bell recipients read</p>
         <progress aria-label={row.title+" notification reads"} className="mt-2 h-2 w-full"
          value={receipt.cellRead} max={1}/>
        </li>;
       })}</ul>
      </section>:null}
      <AnnouncementAdminWorkspace items={items} targets={targets} requiresPublicationConsent
        emptyMessage={announcementHistoryEmptyMessage({
          hasFilters:Boolean(params.q || params.receiverType || params.visibility || params.pinned || params.senderType || includeDeleted),
        })}/>
      {next ? (
        <div className="flex justify-center">
          <Link href={next} className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground">
            Older announcements
          </Link>
        </div>
      ) : null}
    </div>
  );
}
