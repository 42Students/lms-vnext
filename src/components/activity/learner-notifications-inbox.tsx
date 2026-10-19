"use client";

import { Input } from "@/components/ui/input";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {learnerNotificationLoadStatus} from "@/modules/activity/learner-notifications-partial-model";
import {learnerAnnouncementAudienceContext} from "@/modules/activity/learner-notification-context-model";
import {learnerNotificationPreviewNotice} from "@/modules/activity/learner-notification-preview-notice-model";
import {learnerNotificationMobileFilterSummary} from "@/modules/activity/learner-notification-mobile-model";
import {learnerInboxEmptyLabel} from "@/modules/activity/learner-inbox-empty-label-model";
import {learnerNotificationPendingCount,learnerNotificationReadAllSchema}
  from "@/modules/activity/learner-notification-read-all-model";
import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { useGuardedAction } from "@/hooks/use-guarded-action";
import { FRIENDLY_MESSAGES } from "@/lib/friendly-error";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AnnouncementFeedItem } from "@/components/announcements/announcement-feed";
import { filterLearnerInbox,learnerNotificationInboxQuerySchema,
  type LearnerInboxQuery,learnerNotificationInboxHref } from "@/modules/activity/learner-notification-inbox-model";
import { NotificationList, type NotificationListItem } from "./notification-list";
import {learnerNotificationPlacementAction} from "@/modules/activity/learner-notification-placement-action-model";
import {
  learnerNotificationCategories,
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
  const [confirmReadAll,setConfirmReadAll]=useState(false);
  const { pending: markingAll, run: runMarkAll } = useGuardedAction();
  const [markAllError,setMarkAllError]=useState<string|null>(null);

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
          externalCta:(item.buttonLabel && item.buttonUrl && (()=>{try{
            const parsed=new URL(item.buttonUrl);
            return parsed.protocol==="https:" && parsed.hostname && !parsed.username && !parsed.password
             ?{label:item.buttonLabel,href:parsed.href}:null;
          }catch{return null;}})()) || null,
          readAt: null,
          source: "ANNOUNCEMENT",
          pinned: item.isPinned,
          contextLine:learnerAnnouncementAudienceContext(item.receiverType),
        }))
      : [];

    return [...personal, ...publicItems].sort((a, b) =>
      Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
      a.id.localeCompare(b.id),
    );
  }, [personal, announcements, announcementsEnabled]);

  const visible = useMemo(() => filterLearnerInbox(combined,{category:active,unread,q:search}),
    [combined,active,unread,search]);
  const unreadPersonalCount=learnerNotificationPendingCount(personal);
  const mobileSummary=learnerNotificationMobileFilterSummary({category:active,unread,q:search},visible.length);
  async function markAllRead(){
    if(!learnerNotificationReadAllSchema.safeParse({confirmed:true}).success)return;
    setMarkAllError(null);
    try{
      await runMarkAll(async () => {
        await apiFetch("/api/notifications/read-all", { method: "POST", timeoutMs: 25_000 });
        setConfirmReadAll(false);
        router.refresh();
      });
    }catch(error){
      setMarkAllError(error instanceof Error ? error.message : FRIENDLY_MESSAGES.unexpected);
    }
  }
  const filtered=active!=="all" || unread!=="all" || search.trim()!=="";
  function applySearch(){
    router.push(learnerNotificationInboxHref({category:active,unread,q:search}));
  }
  function selectCategory(category:LearnerNotificationCategory){
    setActive(category);
    router.push(learnerNotificationInboxHref({category,unread,q:search}));
  }
  function selectUnread(value:"all"|"unread"){
    setUnread(value);
    router.push(learnerNotificationInboxHref({category:active,unread:value,q:search}));
  }
  function resetFilters(){
    setActive("all");setUnread("all");setSearch("");
    router.push("/learn/notifications");
  }

  return (
    <section className="space-y-5" aria-label="Learner notifications inbox">
      <p role="status" className="text-sm text-body sm:hidden">{mobileSummary}</p>
      <nav aria-label="Filter notifications by type" className="min-w-0">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {learnerNotificationCategories.map(({ key, label }) => (
            <Button variant="secondary"
              key={key}
              type="button"
              aria-pressed={active === key}
              onClick={() => selectCategory(key)}
              className={active === key
                ? "min-h-[var(--lms-control-height)] min-w-0 rounded-full bg-[var(--lms-button-primary)] px-2 text-center text-sm font-semibold text-[var(--lms-on-primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
                : "min-h-[var(--lms-control-height)] min-w-0 rounded-full border border-border bg-surface px-2 text-center text-sm font-semibold text-body transition hover:border-primary hover:text-primary-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"}
            >
              {label}
            </Button>
          ))}
        </div>
      </nav>
      <div className="grid min-w-0 grid-cols-1 gap-3 border-b border-border pb-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
        <label className="text-xs font-semibold text-body">
          Search notifications
          <Input type="search" value={search} maxLength={100}
            onChange={event=>setSearch(event.target.value)}
            onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();applySearch();}}}
            placeholder="Search title or message"
            className="mt-1 min-h-[var(--lms-control-height)]  w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground"/>
        </label>
        <Button variant="secondary" type="button" aria-pressed={unread==="unread"}
          onClick={()=>selectUnread(unread==="unread"?"all":"unread")}
          className="min-h-[var(--lms-control-height)]  rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-foreground">
          {unread==="unread"?"Unread only ✓":"Unread only"}
        </Button>
        <Button variant="secondary" type="button" onClick={applySearch}
          className="min-h-[var(--lms-control-height)]  rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text">
          Apply search
        </Button>
        <Button variant="secondary" type="button" disabled={!filtered} onClick={resetFilters}
          className="min-h-[var(--lms-control-height)]  rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text disabled:opacity-50">
          Clear filters
        </Button>
      </div>
      {unreadPersonalCount>0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3">
          <p className="text-sm text-body">{unreadPersonalCount} unread personal notifications</p>
          <Button variant="secondary" size="sm" onClick={()=>{setMarkAllError(null);setConfirmReadAll(true);}}>
            Mark all personal as read
          </Button>
        </div>
      ):null}
      <p role="status" className="text-xs text-muted-foreground">
        Showing {visible.length} of {combined.length} loaded notifications in this filtered view.
        College announcements have no personal read status.
        {" "}{learnerNotificationPreviewNotice(personal.length,60)}
        {" "}<Link href="/learn/notifications/history" className="font-semibold text-primary-text underline">
          Browse personal history
        </Link>
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
      <div className="min-w-0 [&_article]:min-w-0 [&_article]:break-words [&_article_a]:max-w-full">
      {visible.length === 0 ? (
        <div className="space-y-3">
          <NotificationList items={[]} emptyText={
            learnerInboxEmptyLabel({total:combined.length,category:active,unread,search})
          } />
          {filtered ? (
            <Button variant="secondary" type="button" onClick={resetFilters}
              className="min-h-[var(--lms-control-height)] text-sm font-semibold text-primary-text hover:underline">
              View all
            </Button>
          ) : null}
        </div>
      ) : (
        <NotificationList items={visible.map(item=>({
            ...item,
            actionHref:learnerNotificationPlacementAction(item.actionHref)?.href??null,
            actionLabel:learnerNotificationPlacementAction(item.actionHref)?.label,
          }))}
          onSelect={setSelected} readEndpoint="/api/learn/notifications" />
      )}
      </div>
      <Dialog open={confirmReadAll} onOpenChange={value=>{if(!markingAll)setConfirmReadAll(value);}}
        title="Mark all personal notifications as read?"
        description="This acknowledges all unread notifications in your current college, including older pages. College announcements have no personal read status."
        footer={<>
          <Button variant="secondary" disabled={markingAll} onClick={()=>setConfirmReadAll(false)}>Keep unread</Button>
          <Button disabled={markingAll} onClick={()=>void markAllRead()}>
            {markingAll?"Updating…":"Confirm mark all read"}
          </Button>
        </>}>
        {markAllError?<p role="alert" className="text-sm text-error">{markAllError}</p>:null}
      </Dialog>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        title={selected?.title ?? "Notification"}
        description={selected?.source === "ANNOUNCEMENT" ? "College announcement" : "Personal notification"}
        footer={
          <>
            {learnerNotificationPlacementAction(selected?.actionHref) ? (
              <Link
                href={learnerNotificationPlacementAction(selected?.actionHref)!.href}
                onClick={() => setSelected(null)}
                className="inline-flex min-h-11 sm:min-h-9 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-surface px-4 text-center text-sm font-semibold text-primary-text sm:w-auto"
              >
                {learnerNotificationPlacementAction(selected?.actionHref)?.label??"Open details"}
              </Link>
            ) : null}
            {selected?.source==="ANNOUNCEMENT"&&selected.externalCta?
              <a href={selected.externalCta.href} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-primary px-4 text-sm font-semibold text-primary-text">
                {selected.externalCta.label} ↗
              </a>:null}
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
