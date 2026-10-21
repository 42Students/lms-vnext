import {Button} from "@/components/ui/button";
import {MetricBar} from "@/components/ui/metric-bar";
import chartStyles from "@/components/placements/report-bar-chart.module.css";
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
import { Banner } from "@/components/ui/banner";
import { ErrorState } from "@/components/ui/error-state";
import { AuthorizationError } from "@/modules/permissions/policy";
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
import { StatusBadge } from "@/components/ui/status-badge";
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
  const rawParams = await searchParams;
  // The legacy search used `query`; retain it as an alias for the canonical `q`.
  const {query: legacyQuery, ...canonicalParams} = rawParams;
  const params = parseSuperAdminAnnouncementParams({
    ...canonicalParams,
    q: canonicalParams.q ?? legacyQuery,
  });
  if (!params) {
    return <div className="min-w-0 space-y-6">
      <PageHeader title="Announcements" description="Review and publish college notices." />
      <p role="alert" className="border-l-2 border-warning-border bg-warning-subtle px-3 py-2 text-body">Invalid announcement filters or pagination cursor. <Link href="/admin/announcements" className="font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] underline-offset-4">Reset filters</Link></p>
    </div>;
  }

  if (!announcementsRuntimeEnabled()) {
    return (
      <div className="min-w-0 space-y-6">
        <PageHeader
          title="Announcements"
          description="Announcements are temporarily unavailable. Please try again later."
        />
        <div role="status" className="border-l-2 border-warning-border bg-warning-subtle px-3 py-2">
          <p className="m-0 font-semibold text-foreground">Announcements database is not enabled.</p>
          <p className="mt-2 text-sm text-body">Apply and verify migration 0076, then explicitly set DB10_ANNOUNCEMENTS_READY=DB10_VERIFIED. No announcement DB reads or writes are attempted while disabled.</p>
        </div>
      </div>
    );
  }

  const includeDeleted = params.deleted === "1";
  const [pageResult,targetsResult,broadcastResult] = await Promise.all([
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
    }).then(value=>({ok:true as const,value}))
      .catch(error=>{
        if(error instanceof AuthorizationError)throw error;
        return {ok:false as const,value:null};
      }),
    listAnnouncementTargetOptions(context)
      .then(value=>({ok:true as const,value}))
      .catch(error=>{
        if(error instanceof AuthorizationError)throw error;
        return {ok:false as const,value:null};
      }),
    listSuperAdminBroadcastColleges(context)
      .then(value=>({ok:true as const,value}))
      .catch(error=>{
        if(error instanceof AuthorizationError)throw error;
        return {ok:false as const,value:[]};
      }),
  ]);
  if(!pageResult.ok||!pageResult.value)return <div className="min-w-0 space-y-6">
    <PageHeader title="Announcements" description="Review and publish college notices."/>
    <ErrorState title="Couldn&apos;t load announcements"
      description="The authorized notice list is temporarily unavailable. No published notice was changed."
      action={<Link href="/admin/announcements"
        className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
        Retry
      </Link>}/>
  </div>;
  const page=pageResult.value;
  const targetGroups=targetsResult.value;
  const broadcastColleges=broadcastResult.value;

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

  const receiptResult=await getSuperAdminBroadcastReceiptCounts(context,
    page.items.filter(x=>x.senderType==="SUPER_ADMIN"&&x.receiverType==="COLLEGE").map(x=>x.id))
    .then(value=>({ok:true as const,value}))
    .catch(error=>{
      if(error instanceof AuthorizationError)throw error;
      return {ok:false as const,value:new Map<string,{delivered:number;read:number;cellRead:number}>()};
    });
  const receipts=receiptResult.value;
  // Only SUPER_ADMIN-to-COLLEGE rows belong to the legacy Placement cells feed.
  // The persisted broadcast identity prevents grouping unrelated notices with equal copy.
  const groupedBroadcasts = new Map<string, typeof page.items>();
  for (const item of page.items) {
    if (item.senderType !== "SUPER_ADMIN" || item.receiverType !== "COLLEGE") continue;
    const groupKey = item.broadcastGroupId ?? item.id;
    const copies = groupedBroadcasts.get(groupKey) ?? [];
    copies.push(item);
    groupedBroadcasts.set(groupKey, copies);
  }
  const broadcastFeed = [...groupedBroadcasts].map(([id, copies]) => ({
    id, copies, first: copies[0]!,
  })).sort((a,b)=>Number(b.first.isPinned)-Number(a.first.isPinned)
    || b.first.createdAt.getTime()-a.first.createdAt.getTime());
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
        title="Announcements"
        description="Target, schedule, pin, edit, soft-delete and restore college communications."
        actions={<div className="flex flex-wrap items-center gap-2">
          <SuperAdminCollegeBroadcastForm colleges={broadcastColleges}/>
          <Link
            href={"/admin/announcements?" + new URLSearchParams({ ...(includeDeleted ? {} : {deleted:"1"}), ...(params.q ? {q:params.q} : {}), ...(params.receiverType ? {receiverType:params.receiverType} : {}), ...(params.visibility ? {visibility:params.visibility} : {}), ...(params.pinned ? {pinned:params.pinned} : {}), ...(params.senderType ? {senderType:params.senderType} : {}) }).toString()}
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-[650] text-foreground md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)]"
          >
            {includeDeleted ? "Active only" : "Include deleted"}
          </Link>
        </div>}
      />
      <form method="get" role="search" aria-label="Announcement filters" className="grid min-w-0 grid-cols-1 items-end gap-[8px] border-b border-border pb-4 min-[768px]:grid-cols-[minmax(0,1fr)_auto_auto]">
        {includeDeleted ? <Input type="hidden" name="deleted" value="1"/> : null}
        <label className="min-w-0 w-full text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search announcement title or message
          <Input name="q" defaultValue={params.q ?? ""} maxLength={120} placeholder="Search title or message" className="mt-[6px] w-full"/>
        </label>
        <div className="order-last min-w-0 min-[768px]:col-span-3">
          <details className="group min-w-0 border-t border-[var(--lms-canvas-border)]">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between text-sm font-semibold text-[var(--lms-body-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Filters <span aria-hidden="true">⌄</span></summary>
            <div className="grid min-w-0 gap-3 pb-4 min-[768px]:grid-cols-2 min-[1200px]:grid-cols-4">
        <label className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Visibility
          <Select name="visibility" defaultValue={params.visibility ?? ""} className="mt-[6px]">
            <option value="">All visible states</option>
            <option value="LIVE">Live</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="EXPIRED">Expired</option>
            <option value="DELETED">Deleted only</option>
          </Select>
        </label>
        <label className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Pinned
          <Select name="pinned" defaultValue={params.pinned ?? ""} className="mt-[6px]">
            <option value="">All notices</option><option value="PINNED">Pinned only</option><option value="UNPINNED">Not pinned</option>
          </Select>
        </label>
        <label className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Published by
          <Select name="senderType" defaultValue={params.senderType ?? ""} className="mt-[6px]">
            <option value="">All senders</option>{ANNOUNCEMENT_SENDER_TYPES.map(type=><option key={type} value={type}>{type}</option>)}
          </Select>
        </label>
        <label className="text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Audience type
          <Select name="receiverType" defaultValue={params.receiverType ?? ""} className="mt-[6px]">
            <option value="">All audiences</option>
            {(["COLLEGE","PROGRAM","DEPARTMENT","CLASS","LEARNER","FACULTY"] as const).map(type => <option key={type} value={type}>{type}</option>)}
          </Select>
        </label>
            </div>
          </details>
        </div>
        <Button type="submit" className="w-full min-[768px]:w-auto">Search</Button>
        <Link href="/admin/announcements" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 min-[768px]:w-auto hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">Clear</Link>
      </form>
      {!targetsResult.ok?<Banner tone="warning" role="status"
        action={<Link href="/admin/announcements" className="font-semibold text-primary-text underline">Retry targets</Link>}>
        Announcement audience options could not be loaded. Existing notices remain visible;
        select-audience publishing options are temporarily unavailable.
      </Banner>:null}
      {!broadcastResult.ok?<Banner tone="warning" role="status"
        action={<Link href="/admin/announcements" className="font-semibold text-primary-text underline">Retry colleges</Link>}>
        Broadcast colleges could not be loaded. No broadcast audience was assumed or published.
      </Banner>:null}
      {!receiptResult.ok?<Banner tone="warning" role="status"
        action={<Link href="/admin/announcements" className="font-semibold text-primary-text underline">Retry read receipts</Link>}>
        Placement-cell read counts are temporarily unavailable. Do not infer unread or zero reach.
      </Banner>:null}
      {receipts.size?<section aria-label="Placement-cell read receipts" className="min-w-0 space-y-3 border-t border-border pt-6">
       <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">Placement-cell read receipts</h2>
       <p className="text-sm text-muted-foreground">Durable first-read receipts for each selected college notice. Each notice is addressed to one placement cell; notification delivery is shown separately, and only an explicit acknowledgement counts as a placement-cell read. A 1-of-1 cell receipt is not the total reach of a multi-college broadcast.</p>
       <ul className="min-w-0 space-y-2">{page.items.filter(row=>receipts.has(row.id)).map(row=>{
        const receipt=receipts.get(row.id)!;
        return <li key={row.id} className="border-b border-border py-3 text-sm">
         <p className="font-semibold">{row.title}</p><p className="text-muted-foreground">{receipt.cellRead} of 1 placement cell read · {receipt.read}/{receipt.delivered} bell recipients read</p>
         <MetricBar role="progressbar" label={row.title+" notification reads"} className={chartStyles.track+" mt-2 w-full"}
          value={receipt.cellRead} maximum={1} unit="placement cell" />
        </li>;
       })}</ul>
      </section>:null}
      <Banner tone="info" role="status">
        Broadcast notices are stored as separate college records. This view does not yet
        combine them by broadcast group or calculate distinct colleges reached; the individual
        placement-cell receipts above must not be treated as an all-colleges delivery total.
        Scheduled-delivery retry, cancel and the cross-type recycle bin require separate,
        audited operator services and are not available through this announcements list.
      </Banner>
      <AnnouncementAdminWorkspace items={items} targets={targets} requiresPublicationConsent
        emptyMessage={announcementHistoryEmptyMessage({
          hasFilters:Boolean(params.q || params.receiverType || params.visibility || params.pinned || params.senderType || includeDeleted),
        })}/>
      <Link href={"/api/admin/announcements/export?" + new URLSearchParams({
        ...(includeDeleted ? {deleted:"1"} : {}),
        ...(params.q ? {q:params.q} : {}),
        ...(params.receiverType ? {receiverType:params.receiverType} : {}),
        ...(params.visibility ? {visibility:params.visibility} : {}),
        ...(params.pinned ? {pinned:params.pinned} : {}),
        ...(params.senderType ? {senderType:params.senderType} : {}),
        ...(params.beforeCreatedAt ? {beforeCreatedAt:params.beforeCreatedAt} : {}),
        ...(params.beforeId ? {beforeId:params.beforeId} : {}),
      }).toString()} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">Export this filtered page (CSV)</Link>
      {next ? (
        <div className="flex justify-center">
          <Link href={next} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white">
            Older announcements
          </Link>
        </div>
      ) : null}
      </section>
    </div>
  );
}
