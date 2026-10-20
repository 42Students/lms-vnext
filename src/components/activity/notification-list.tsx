"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
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
      await apiFetch(readEndpoint + "/" + encodeURIComponent(id) + "/read", {
        method: "POST",
        credentials: "same-origin",
        timeoutMs: 12000,
        headers: { Accept: "application/json" },
      });
      acknowledged = true;
    } catch (reason) {
      showToast({
        tone: "error",
        title: "Could not mark this notification as read",
        description: reason instanceof FriendlyFetchError
          ? reason.message : friendlyApiError({network: true}),
      });
    } finally {
      setPendingId(null);
      // TPO-inbox-team-64: never navigate away on failed acknowledgement.
      if (acknowledged && openHref) router.push(openHref);
      else if (acknowledged) router.refresh();
    }
  }

  if (items.length === 0) {
    return (
      <div className="border-y border-border bg-transparent px-6 py-12 text-center">
        <p className="m-0 font-semibold text-foreground">{emptyText}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Workflow notifications and announcements appear when their producers publish them.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {groupNotificationsByDate(items, groupingNow).map((group) => (
        <section key={group.label} aria-label={group.label} className="grid gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground">{group.label}</h2>
          {group.items.map((item) => (
            variant==="tpo"?<Button variant="ghost" type="button" key={item.id} disabled={pendingId!==null}
              onClick={()=>{
               if(item.readAt){if(item.actionHref)router.push(item.actionHref);return;}
               void markRead(item.id,item.actionHref??undefined);
              }}
              aria-label={"Open notification: "+item.title}
              className="w-full min-h-12 justify-start rounded-none border-x-0 border-t-0 border-b border-[var(--lms-canvas-border)] bg-transparent px-0 py-4 text-left whitespace-normal shadow-none hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-[768px]:py-5">
              <div className="flex items-start gap-3">
               {!item.readAt?<span aria-hidden="true" className="mt-2 inline-block size-2 shrink-0 rounded-full bg-primary"/>:null}
               <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                 <strong className="break-words">{item.title}</strong>
                 {!item.readAt?<Badge tone="info">New</Badge>:null}
                </div>
                <p className="mt-1 break-words text-sm text-body">{item.body}</p>
                <time className="mt-2 block text-xs text-muted-foreground" dateTime={item.createdAt}>{formatWhen(item.createdAt)}</time>
               </div><span aria-hidden="true" className="text-primary-text">→</span>
              </div>
             </Button>:<article
              key={item.id}
              className="border-b border-[var(--lms-canvas-border)] bg-transparent py-4 transition-colors duration-150 hover:bg-primary-subtle focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary min-[768px]:py-5"
            >
              <div className="flex flex-col gap-3 min-[768px]:flex-row min-[768px]:items-start min-[768px]:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge>{item.source === "ANNOUNCEMENT" ? "Announcement" : item.module}</StatusBadge>
                    {item.source === "ANNOUNCEMENT" && item.pinned ? (
                      <StatusBadge tone="warning">Pinned</StatusBadge>
                    ) : null}
                    {!item.readAt && item.source !== "ANNOUNCEMENT" ? <StatusBadge tone="info">Unread</StatusBadge> : null}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold leading-[1.35] text-foreground min-[768px]:text-base">
                    {onSelect ? (
                      <Button
                        type="button"
                        onClick={() => onSelect(item)}
                        variant="ghost" className="min-h-11 min-[768px]:min-h-9 text-left underline-offset-2 hover:underline"
                        aria-label={`View notification: ${item.title}`}
                      >
                        {item.title}
                      </Button>
                    ) : item.title}
                  </h3>
                  {item.contextLine?<p className="mt-1 text-xs font-semibold text-muted-foreground">{item.contextLine}</p>:null}
                  <p className="mt-1 text-sm leading-[1.5] text-body">{item.body}</p>
                  <p className="mt-2 text-xs leading-[1.4] text-muted-foreground">
                    {formatWhen(item.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {item.actionHref ? (
                    item.readAt ? (
                      <Link
                        href={item.actionHref}
                        className="inline-flex min-h-11 min-[768px]:min-h-9 items-center justify-center rounded-[var(--lms-control-radius,9px)] border border-border px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle"
                      >
                        {item.actionLabel??"Open"}
                      </Link>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="min-h-11 min-[768px]:min-h-9"
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
                      className="min-h-11 min-[768px]:min-h-9"
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
