"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
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

function safeInternalAction(href:string|null):string|null {
  if(!href||!href.startsWith("/")||href.startsWith("//")||/[\\\r\n]/.test(href))return null;
  return href;
}
function safeExternalAction(href:string):string|null{
  try{
    const url=new URL(href);
    return url.protocol==="https:"&&Boolean(url.hostname)&&!url.username&&!url.password?url.toString():null;
  }catch{return null;}
}
function legacyActionLabel(item:NotificationListItem):string{
  if(item.actionLabel)return item.actionLabel;
  const path=item.actionHref??"";
  if(/assessment|quiz/i.test(path))return "Take Assessment";
  if(/interview/i.test(path))return "View Interview";
  if(/applications?/i.test(path))return "View in My Applications";
  if(/course|lesson/i.test(path))return "View Course";
  return "View";
}
function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function NotificationList({
  items,
  emptyText = "You are all caught up.",
  emptyAction,
  onSelect,
  readEndpoint = "/api/notifications",
  variant = "default",
}: {
  items: readonly NotificationListItem[];
  emptyText?: string;
  emptyAction?: ReactNode;
  onSelect?: (item: NotificationListItem) => void;
  variant?: "default" | "tpo";
  readEndpoint?: "/api/notifications" | "/api/learn/notifications" | "/api/mentor/notifications" | "/api/tpo/notifications" | "/api/notifications/faculty";
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [groupingNow] = useState(() => new Date());

  async function markRead(id: string) {
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
      // Opening details does not acknowledge; only the explicit Mark read
      // control performs the recipient-scoped mutation.
      if (acknowledged) router.refresh();
    }
  }

  if (items.length === 0) {
    return (
      <div className={readEndpoint==="/api/learn/notifications"
        ? "flex min-h-[180px] flex-col items-center justify-center gap-4 bg-transparent px-6 py-12 text-center"
        : readEndpoint==="/api/tpo/notifications" ? "bg-transparent px-4 py-6 text-center" : "border-y border-[var(--lms-canvas-border)] bg-transparent px-6 py-12 text-center"}>
        <p className={readEndpoint==="/api/learn/notifications"
          ? "m-0 text-[20px] font-semibold leading-[1.3] text-[var(--lms-neutral-900)]"
          : "m-0 font-semibold text-foreground"}>{emptyText}</p>
        <p className={readEndpoint==="/api/learn/notifications"
          ? "mx-auto max-w-[320px] text-[14px] leading-[1.5] text-[var(--lms-neutral-500)]"
          : "mt-2 text-sm text-muted-foreground"}>
          Workflow notifications and announcements appear when their producers publish them.
        </p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className={readEndpoint==="/api/learn/notifications" ? "space-y-[var(--lms-space-3)]" : variant==="tpo" ? "space-y-0" : "min-w-0 space-y-4"}>
      {groupNotificationsByDate(items, groupingNow).map((group) => (
        <section key={group.label} aria-label={group.label}
          className="min-w-0 space-y-2">
          <h2 className="border-b border-[var(--lms-canvas-border)] pb-2 text-[13px] font-semibold leading-5 text-muted-foreground">{group.label}</h2>
          {group.items.map((item) => (
            variant==="tpo"?<Button variant="ghost" type="button" key={item.id} disabled={pendingId!==null}
              onClick={()=>{
               if(onSelect){onSelect(item);return;}
               const href=safeInternalAction(item.actionHref);
               if(href)router.push(href);
              }}
              aria-label={"Open notification: "+item.title}
              loading={pendingId===item.id}
              className="w-full min-h-12 justify-start rounded-none border-x-0 border-t-0 border-b border-[var(--lms-canvas-border)] bg-transparent px-0 py-4 text-left whitespace-normal shadow-none hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:py-4">
              <div className="flex min-w-0 items-start gap-3">
               <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                 <strong className="break-words">{item.title}</strong>
                 {!item.readAt?<Badge tone="info">New</Badge>:null}
                </div>
                <p className="mt-1 break-words text-sm text-body leading-[22px]">{item.body}</p>
                <time className="mt-2 block text-xs text-muted-foreground" dateTime={item.createdAt}>{formatWhen(item.createdAt)}</time>
               </div>{item.actionHref ? <span aria-hidden="true" className="shrink-0 text-primary-text">→</span> : null}
              </div>
             </Button>:<article
              key={item.id}
              className={readEndpoint==="/api/learn/notifications"
                ? "min-w-0 border-b border-[var(--lms-canvas-border)] bg-transparent py-3 transition-colors duration-200 hover:bg-[var(--lms-primary-subtle)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
                : "min-w-0 border-b border-[var(--lms-canvas-border)] bg-transparent py-4 transition-colors duration-150 hover:bg-primary-subtle focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary min-[768px]:py-4"}
            >
              <div className="flex flex-col gap-3 min-[768px]:flex-row min-[768px]:items-start min-[768px]:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge>{item.source === "ANNOUNCEMENT" ? "Announcement" : item.module}</StatusBadge>
                    {item.source === "ANNOUNCEMENT" && item.pinned ? (
                      <StatusBadge tone="warning">Pinned</StatusBadge>
                    ) : null}
                    {!item.readAt && item.source !== "ANNOUNCEMENT" ? <StatusBadge tone="info">Unread</StatusBadge> : null}
                  </div>
                  <h3 className="mt-2 break-words text-sm font-semibold leading-6 text-[var(--lms-heading)] min-[768px]:text-base">
                    {onSelect ? (
                      <Button
                        type="button"
                        onClick={() => onSelect(item)}
                        variant="ghost" className="min-h-11 min-[768px]:min-h-9 !text-[14px] min-[768px]:!text-[16px] !leading-[1.35] text-left underline-offset-2 hover:underline"
                        aria-label={`View notification: ${item.title}`}
                      >
                        {item.title}
                      </Button>
                    ) : item.title}
                  </h3>
                  {item.contextLine?<p className="mt-1 text-xs font-semibold text-muted-foreground leading-5">{item.contextLine}</p>:null}
                  <p className={readEndpoint==="/api/learn/notifications"
                    ? "mt-2 line-clamp-2 text-[13px] min-[768px]:text-[14px] leading-[1.5] text-[var(--lms-neutral-500)]"
                    : "mt-1 text-sm leading-[1.5] text-body"}>{item.body}</p>
                  <p className="mt-2 text-xs leading-[1.4] text-muted-foreground">
                    {formatWhen(item.createdAt)}
                  </p>
                </div>
                <div className="flex w-full shrink-0 flex-wrap gap-2 min-[768px]:w-auto min-[768px]:justify-end">
                  {safeInternalAction(item.actionHref) ? (
                    (
                      <Link
                        href={safeInternalAction(item.actionHref)!}
                        className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-[var(--lms-control-radius,9px)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-3 text-sm font-semibold text-[var(--lms-on-primary)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9 min-[768px]:flex-none"
                      >
                        {legacyActionLabel(item)}
                      </Link>
                    )
                  ) : null}
                  {item.externalCta&&safeExternalAction(item.externalCta.href)?(
                    <a href={safeExternalAction(item.externalCta.href)!} target="_blank" rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] border border-[var(--lms-button-primary)] px-3 text-sm font-semibold text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                      {item.externalCta.label||"Take Assessment"}
                    </a>
                  ):null}
                  {!item.readAt && item.source !== "ANNOUNCEMENT" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={pendingId === item.id}
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
