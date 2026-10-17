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
  /** Announcement rows have their own visibility policy, no recipient read flag. */
  source?: "ANNOUNCEMENT";
  pinned?: boolean;
  actionLabel?:string;
  contextLine?:string;
  externalCta?:{label:string;href:string}|null;
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
  onSelect,
  readEndpoint = "/api/notifications",
  variant = "default",
}: {
  items: readonly NotificationListItem[];
  emptyText?: string;
  onSelect?: (item: NotificationListItem) => void;
  variant?: "default" | "tpo";
  readEndpoint?: "/api/notifications" | "/api/learn/notifications" | "/api/mentor/notifications" | "/api/tpo/notifications" | "/api/notifications/faculty";
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [groupingNow] = useState(() => new Date());

  async function markRead(id: string, openHref?: string) {
    setPendingId(id);
    let acknowledged = false;
    try {
      const response = await fetch(
        readEndpoint + "/" + id + "/read",
        { method: "POST" },
      );
      if (!response.ok) {
        throw new Error("Could not mark notification read");
      }
      acknowledged = true;
    } catch (error) {
      showToast({
        tone: "error",
        title: "Notification update failed",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPendingId(null);
      if (openHref) {
        // A failed acknowledgment must not trap users in this page.
        router.push(openHref);
      } else if (acknowledged) {
        router.refresh();
      }
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
      {groupNotificationsByDate(items, groupingNow).map((group) => (
        <section key={group.label} aria-label={group.label} className="grid gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">{group.label}</h2>
          {group.items.map((item) => (
            variant==="tpo"?<button type="button" key={item.id} disabled={pendingId!==null}
              onClick={()=>{
               if(item.readAt){if(item.actionHref)router.push(item.actionHref);return;}
               void markRead(item.id,item.actionHref??undefined);
              }}
              aria-label={"Open notification: "+item.title}
              className="w-full min-h-12 rounded-xl border border-border bg-surface p-4 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50">
              <div className="flex items-start gap-3">
               {!item.readAt?<span aria-hidden="true" className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-primary"/>:null}
               <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                 <strong className="break-words">{item.title}</strong>
                 {!item.readAt?<span className="rounded border border-border px-2 py-0.5 text-xs font-semibold">New</span>:null}
                </div>
                <p className="mt-1 break-words text-sm text-body">{item.body}</p>
                <time className="mt-2 block text-xs text-muted-foreground" dateTime={item.createdAt}>{formatWhen(item.createdAt)}</time>
               </div><span aria-hidden="true" className="text-primary-text">→</span>
              </div>
             </button>:<article
              key={item.id}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge>{item.source === "ANNOUNCEMENT" ? "Announcement" : item.module}</StatusBadge>
                    {item.source === "ANNOUNCEMENT" && item.pinned ? (
                      <StatusBadge tone="warning">Pinned</StatusBadge>
                    ) : null}
                    {!item.readAt && item.source !== "ANNOUNCEMENT" ? <StatusBadge tone="info">Unread</StatusBadge> : null}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-foreground">
                    {onSelect ? (
                      <button
                        type="button"
                        onClick={() => onSelect(item)}
                        className="min-h-10 text-left underline-offset-2 hover:text-primary-text hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
                        aria-label={`View notification: ${item.title}`}
                      >
                        {item.title}
                      </button>
                    ) : item.title}
                  </h3>
                  {item.contextLine?<p className="mt-1 text-xs font-semibold text-muted-foreground">{item.contextLine}</p>:null}
                  <p className="mt-1 text-sm leading-6 text-body">{item.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatWhen(item.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {item.actionHref ? (
                    item.readAt ? (
                      <Link
                        href={item.actionHref}
                        className="inline-flex min-h-9 items-center justify-center rounded-md border border-border px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
                      >
                        {item.actionLabel??"Open"}
                      </Link>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={pendingId !== null}
                        onClick={() => markRead(item.id, item.actionHref ?? undefined)}
                      >
                        {pendingId === item.id ? "Opening…" : (item.actionLabel??"Open")}
                      </Button>
                    )
                  ) : null}
                  {!item.readAt && item.source !== "ANNOUNCEMENT" ? (
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
