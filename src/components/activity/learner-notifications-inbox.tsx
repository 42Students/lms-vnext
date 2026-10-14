"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {learnerNotificationLoadStatus} from "@/modules/activity/learner-notifications-partial-model";
import { useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AnnouncementFeedItem } from "@/components/announcements/announcement-feed";
import { filterLearnerInbox,learnerNotificationInboxQuerySchema,
  type LearnerInboxQuery } from "@/modules/activity/learner-notification-inbox-model";
import { NotificationList, type NotificationListItem } from "./notification-list";
import {learnerNotificationAssessmentAction} from "@/modules/activity/learner-notification-assessment-action-model";
import {
  learnerNotificationCategories,
  learnerNotificationCategoryCounts,
  type LearnerNotificationCategory,
} from "@/modules/activity/learner-notification-category";

export function LearnerNotificationsInbox({
  personal,
  announcements,
  announcementsEnabled,
  announcementsLoadFailed=false,
  initialFilters,
}: {
  personal: readonly NotificationListItem[];
  announcements: readonly AnnouncementFeedItem[];
  announcementsEnabled: boolean;
  announcementsLoadFailed?:boolean;
  initialFilters?: LearnerInboxQuery;
}) {
  const router=useRouter();
  const sourceStatus=learnerNotificationLoadStatus({
    announcementsEnabled,announcementsFailed:announcementsLoadFailed,
    personalReady:true,
  });
  const defaults=learnerNotificationInboxQuerySchema.parse(initialFilters ?? {});
  const [active, setActive] = useState<LearnerNotificationCategory>(defaults.category);
  const [unread,setUnread] = useState<"all"|"unread">(defaults.unread);
  const [search,setSearch] = useState(defaults.q);
  const [selected, setSelected] = useState<NotificationListItem | null>(null);

  const combined = useMemo(() => {
    const publicItems: NotificationListItem[] = announcementsEnabled
      ? announcements.map((item) => ({
          id: `announcement:${item.id}`,
          title: item.title,
          body: item.message,
          module: "ANNOUNCEMENTS",
          importance: "NORMAL",
          createdAt: item.createdAt.toISOString(),
          actionHref: null,
          readAt: null,
          source: "ANNOUNCEMENT",
          pinned: item.isPinned,
        }))
      : [];

    return [...personal, ...publicItems].sort((a, b) =>
      Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
      a.id.localeCompare(b.id),
    );
  }, [personal, announcements, announcementsEnabled]);

  const counts = useMemo(
    () => learnerNotificationCategoryCounts(combined),
    [combined],
  );
  const visible = useMemo(() => filterLearnerInbox(combined,{category:active,unread,q:search}),
    [combined,active,unread,search]);
  const filtered=active!=="all" || unread!=="all" || search.trim()!=="";
  function resetFilters(){setActive("all");setUnread("all");setSearch("");}

  return (
    <section className="space-y-5" aria-label="Learner notifications inbox">
      <nav aria-label="Filter notifications by type" className="overflow-x-auto">
        <div className="flex min-w-max flex-wrap gap-2">
          {learnerNotificationCategories.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={active === key}
              onClick={() => setActive(key)}
              className={active === key
                ? "min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
                : "min-h-11 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-body transition hover:border-primary hover:text-primary-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"}
            >
              {label} <span className="ml-1 tabular-nums">{counts[key]}</span>
            </button>
          ))}
        </div>
      </nav>
      <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
        <label className="text-xs font-semibold text-body">
          Search notifications
          <input type="search" value={search} maxLength={100}
            onChange={event=>setSearch(event.target.value)}
            placeholder="Search title or message"
            className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground"/>
        </label>
        <button type="button" aria-pressed={unread==="unread"}
          onClick={()=>setUnread(prev=>prev==="unread"?"all":"unread")}
          className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-foreground">
          {unread==="unread"?"Unread only ✓":"Unread only"}
        </button>
        <button type="button" disabled={!filtered} onClick={resetFilters}
          className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text disabled:opacity-50">
          Clear filters
        </button>
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        Showing {visible.length} of {combined.length} notifications. College announcements have no personal read status.
      </p>

      {sourceStatus.state==="PARTIAL" ? (
        <div role="alert" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
          <p className="font-semibold text-foreground">Announcements not refreshed</p>
          <p className="mt-1">{sourceStatus.notice}</p>
          <Button size="sm" variant="secondary" onClick={()=>router.refresh()}>
            Retry announcements
          </Button>
        </div>
      ):null}
      {!announcementsEnabled && (active === "all" || active === "general") ? (
        <div role="status" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
          College announcements are temporarily unavailable while their
          database rollout is being verified. Personal notifications remain available.
        </div>
      ) : null}
      {visible.length === 0 ? (
        <div className="space-y-3">
          <NotificationList items={[]} emptyText={
            active === "all" ? "No notifications yet" : `No ${learnerNotificationCategories.find((tab) => tab.key === active)?.label ?? "matching"} notifications yet`
          } />
          {filtered ? (
            <button type="button" onClick={resetFilters}
              className="min-h-10 text-sm font-semibold text-primary-text hover:underline">
              View all
            </button>
          ) : null}
        </div>
      ) : (
        <NotificationList items={visible.map(item=>({
            ...item,
            actionHref:learnerNotificationAssessmentAction(item.actionHref)?.href??null,
            actionLabel:learnerNotificationAssessmentAction(item.actionHref)?.label,
          }))}
          onSelect={setSelected} readEndpoint="/api/learn/notifications" />
      )}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        title={selected?.title ?? "Notification"}
        description={selected?.source === "ANNOUNCEMENT" ? "College announcement" : "Personal notification"}
        footer={
          <>
            {learnerNotificationAssessmentAction(selected?.actionHref) ? (
              <Link
                href={learnerNotificationAssessmentAction(selected?.actionHref)!.href}
                onClick={() => setSelected(null)}
                className="inline-flex min-h-10 items-center rounded-md border border-primary bg-surface px-4 text-sm font-semibold text-primary-text"
              >
                {learnerNotificationAssessmentAction(selected?.actionHref)?.label??"Open details"}
              </Link>
            ) : null}
            <Button onClick={() => setSelected(null)}>Got it</Button>
          </>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-body">
              {selected.body}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{selected.source === "ANNOUNCEMENT" ? "Announcement" : selected.module}</span>
              {selected.pinned ? <span>Pinned</span> : null}
              <time dateTime={selected.createdAt}>
                {new Intl.DateTimeFormat("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Kolkata",
                }).format(new Date(selected.createdAt))}
              </time>
            </div>
          </div>
        ) : null}
      </Dialog>
    </section>
  );
}
