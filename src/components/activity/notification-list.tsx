"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { groupNotificationsByDate } from "@/modules/activity/notification-groups";

export type NotificationListItem = {
  id: string;
  title: string;
  body: string;
  actionHref: string | null;
  readAt: string | null;
  createdAt: string;
  module: string;
  importance: string;
};

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function NotificationList({
  items,
  emptyText = "You are all caught up.",
}: {
  items: readonly NotificationListItem[];
  emptyText?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function markRead(id: string) {
    setPendingId(id);
    try {
      const response = await fetch(
        "/api/notifications/" + id + "/read",
        { method: "POST" },
      );
      if (!response.ok) {
        throw new Error("Could not mark notification read");
      }
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Notification update failed",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPendingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="m-0 font-semibold text-foreground">{emptyText}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Workflow notifications and announcements appear when their producers publish them.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {groupNotificationsByDate(items, new Date()).map((group) => (
        <section key={group.label} aria-label={group.label} className="grid gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">{group.label}</h2>
          {group.items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge>{item.module}</StatusBadge>
                    {!item.readAt ? <StatusBadge tone="info">Unread</StatusBadge> : null}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-body">{item.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatWhen(item.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {item.actionHref ? (
                    <Link
                      href={item.actionHref}
                      className="inline-flex min-h-9 items-center justify-center rounded-md border border-border px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
                    >
                      Open
                    </Link>
                  ) : null}
                  {!item.readAt ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={pendingId !== null}
                      onClick={() => markRead(item.id)}
                    >
                      {pendingId === item.id ? "Saving…" : "Mark read"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
