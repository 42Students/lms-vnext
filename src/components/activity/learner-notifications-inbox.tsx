"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AnnouncementFeedItem } from "@/components/announcements/announcement-feed";
import { NotificationList, type NotificationListItem } from "./notification-list";
import {
  learnerNotificationCategories,
  learnerNotificationCategory,
  learnerNotificationCategoryCounts,
  type LearnerNotificationCategory,
} from "@/modules/activity/learner-notification-category";

export function LearnerNotificationsInbox({
  personal,
  announcements,
  announcementsEnabled,
}: {
  personal: readonly NotificationListItem[];
  announcements: readonly AnnouncementFeedItem[];
  announcementsEnabled: boolean;
}) {
  const [active, setActive] = useState<LearnerNotificationCategory>("all");
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
  const visible = active === "all"
    ? combined
    : combined.filter((item) => learnerNotificationCategory(item) === active);

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
          {active !== "all" ? (
            <button type="button" onClick={() => setActive("all")}
              className="min-h-10 text-sm font-semibold text-primary-text hover:underline">
              View all
            </button>
          ) : null}
        </div>
      ) : (
        <NotificationList items={visible} onSelect={setSelected} readEndpoint="/api/learn/notifications" />
      )}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        title={selected?.title ?? "Notification"}
        description={selected?.source === "ANNOUNCEMENT" ? "College announcement" : "Personal notification"}
        footer={
          <>
            {selected?.actionHref ? (
              <Link
                href={selected.actionHref}
                onClick={() => setSelected(null)}
                className="inline-flex min-h-10 items-center rounded-md border border-primary bg-surface px-4 text-sm font-semibold text-primary-text"
              >
                Open details
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
