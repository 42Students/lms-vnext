"use client";

import Link from "next/link";
import {Dialog} from "@/components/ui/dialog";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import { groupNotificationsByDate } from "@/modules/activity/notification-groups";
import {safeExternalAssessmentUrl,safeNotificationActionHref} from "@/modules/activity/notification-action";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";

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
  return safeNotificationActionHref(href);
}
function safeExternalAction(href:string):string|null{
  return safeExternalAssessmentUrl(href);
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
function parseLegacyNotificationDate(value:string):Date {
  // Jackson legacy dates may be [year, zero-based month, day, hour, minute].
  if(Array.isArray(value)){
    const parts=value as readonly number[];
    if(parts.length<3||parts.some(v=>!Number.isSafeInteger(v)))return new Date(NaN);
    return new Date(Date.UTC(parts[0]!,parts[1]!,parts[2]!,parts[3]??0,parts[4]??0,parts[5]??0)-330*60_000);
  }
  return new Date(value);
}
function notificationCategory(item:NotificationListItem):string{
  if(item.source==="ANNOUNCEMENT"||/announc/i.test(item.module))return "Announcement";
  if(/COURSE|ASSESSMENT|QUIZ|ASSIGNMENT/i.test(item.module))return "Course";
  if(/PROJECT/i.test(item.module))return "Project";
  if(/PLACEMENT|INTERVIEW/i.test(item.module))return "Placement";
  return "Announcement";
}
function previewBody(body:string):string {
  const value=body.replace(/\s+/g," ").trim();
  return value.length>80?value.slice(0,80).trimEnd()+"...":value;
}
function formatWhen(value: string) {
  const date = parseLegacyNotificationDate(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function NotificationList({
  items,
  emptyText = "No notifications yet",
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
  const [selected,setSelected]=useState<NotificationListItem|null>(null);
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
        <span aria-hidden="true" className="mx-auto flex size-14 items-center justify-center rounded-full bg-[var(--lms-primary-subtle)] text-2xl text-[var(--lms-primary-text)]">🔔</span>
        <p className={readEndpoint==="/api/learn/notifications"
          ? "m-0 text-[20px] font-semibold leading-[1.3] text-[var(--lms-neutral-900)]"
          : "m-0 font-semibold text-foreground"}>{emptyText}</p>
        <p className={readEndpoint==="/api/learn/notifications"
          ? "mx-auto max-w-[320px] text-[14px] leading-[1.5] text-[var(--lms-neutral-500)]"
          : "mt-2 text-sm text-muted-foreground"}>
          {readEndpoint==="/api/tpo/notifications"?"Your placement updates will appear here.":readEndpoint==="/api/mentor/notifications"?"You'll see project updates here when available.":"You'll see course updates and announcements here when available."}
        </p>
        {emptyAction}
      </div>
    );
  }

  return (
    <>
    <div className={readEndpoint==="/api/learn/notifications" ? "space-y-[var(--lms-space-3)]" : variant==="tpo" ? "space-y-3" : "min-w-0 space-y-3"}>
      {groupNotificationsByDate(items, groupingNow).map((group) => (
        <section key={group.label} aria-label={group.label}
          className="min-w-0 space-y-3">
          <Heading level={2} size="sm" className="border-b border-[var(--lms-canvas-border)] pb-2 leading-5 text-muted-foreground">{group.label}</Heading>
          {group.items.map((item) => (
            variant==="tpo"?<Button variant="ghost" type="button" key={item.id} disabled={pendingId!==null}
              onClick={()=>{
               if(onSelect){onSelect(item);return;}
               setSelected(item);
              }}
              aria-label={"Open notification: "+(item.title||"Notification")+", "+notificationCategory(item)}
              loading={pendingId===item.id}
              className="w-full min-h-12 justify-start rounded-[10px] border border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-50)] px-4 py-4 text-left whitespace-normal shadow-none hover:bg-[var(--lms-primary-subtle)] focus-ring md:py-4">
              <div className="flex min-w-0 items-start gap-3">
               <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                 <strong className="break-words">{item.title||"Notification"}</strong>
                 {!item.readAt?<Badge tone="info">New</Badge>:null}
                </div>
                <p className="mt-1 break-words text-sm text-body leading-[22px]">{previewBody(item.body)}</p>
                <time className="mt-2 block text-xs text-muted-foreground" dateTime={item.createdAt}>{formatWhen(item.createdAt)}</time>
               </div>{item.actionHref ? <span aria-hidden="true" className="shrink-0 text-primary-text">→</span> : null}
              </div>
             </Button>:<article
              key={item.id}
              className={readEndpoint==="/api/learn/notifications"
                ? "min-w-0 rounded-[12px] bg-[var(--lms-neutral-50)] p-4 transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-primary-subtle)] focus-within:focus-outline"
                : "min-w-0 rounded-[12px] bg-[var(--lms-neutral-50)] p-4 transition-colors duration-[var(--lms-motion-fast)] hover:bg-[var(--lms-primary-subtle)] focus-within:focus-outline"}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-[var(--lms-neutral-100)] text-lg">🔔</span>
                  <Button variant="ghost" type="button" className="min-w-0 flex-1"
                    aria-label={"View "+(item.title||"Notification")+", "+notificationCategory(item)+(item.contextLine?", "+item.contextLine:"")}
                    onClick={()=>{if(onSelect)onSelect(item);else setSelected(item);}}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge>{notificationCategory(item)}</StatusBadge>
                    {item.source === "ANNOUNCEMENT" && item.pinned ? (
                      <StatusBadge tone="warning">Pinned</StatusBadge>
                    ) : null}
                    {!item.readAt && item.source !== "ANNOUNCEMENT" ? <StatusBadge tone="info">Unread</StatusBadge> : null}
                  </div>
                  <Heading level={3} size="sm" className="mt-2 break-words leading-6 text-[var(--lms-heading)] md:text-base">{item.title||"Notification"}</Heading>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground leading-5">{item.contextLine??item.module??"—"}</p>
                  <p className={readEndpoint==="/api/learn/notifications"
                    ? "mt-2 text-[13px] md:text-[14px] leading-[1.5] text-[var(--lms-neutral-500)]"
                    : "mt-1 text-sm leading-[1.5] text-body"}>{previewBody(item.body)}</p>
                  <p className="mt-2 text-xs leading-[1.4] text-muted-foreground">
                    {formatWhen(item.createdAt)}
                  </p>
                  </Button>
                </div>
                <div className="flex w-full shrink-0 flex-wrap gap-2 md:w-auto md:justify-end">
                  {safeInternalAction(item.actionHref) ? (
                      <Link
                        href={safeInternalAction(item.actionHref)!}
                        className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-[var(--lms-control-radius,9px)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-3 text-sm font-semibold text-[var(--lms-on-primary)] hover:bg-[var(--lms-button-primary-hover)] focus-ring md:min-h-9 md:flex-none"
                      >
                        {legacyActionLabel(item)}
                      </Link>
                  ) : null}
                  {item.externalCta&&safeExternalAction(item.externalCta.href)?(
                    <ButtonLink variant="secondary" href={safeExternalAction(item.externalCta.href)!}>
                      {item.externalCta.label||"Take Assessment"}
                    </ButtonLink>
                  ):null}
                  {!item.readAt && item.source !== "ANNOUNCEMENT" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={pendingId === item.id}
                      className="min-h-11 md:min-h-9"
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
    <Dialog open={selected!==null} onOpenChange={next=>{if(!next)setSelected(null);}}
      title={selected?.title||"Notification"}
      {...(selected ? { description: notificationCategory(selected)+" · "+formatWhen(selected.createdAt) } : {})}
      className="!max-w-[min(520px,calc(100vw-32px))]"
      footer={<>
        {selected&&safeInternalAction(selected.actionHref)?<Link href={safeInternalAction(selected.actionHref)!}
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-[var(--lms-on-primary)]"
          onClick={()=>setSelected(null)}>{legacyActionLabel(selected)}</Link>:null}
        {selected?.externalCta&&safeExternalAction(selected.externalCta.href)?<ButtonLink variant="primary"
          href={safeExternalAction(selected.externalCta.href)!}>
          {selected.externalCta.label}</ButtonLink>:null}
        <Button variant="primary" onClick={()=>setSelected(null)}>Got it</Button>
      </>}>
      {selected?<div className="space-y-3">
        <StatusBadge>{notificationCategory(selected)}</StatusBadge>
        <p className="text-xs text-muted-foreground">{selected.contextLine??selected.module??"—"}</p>
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-body">{selected.body}</p>
      </div>:null}
    </Dialog>
    </>
  );
}
