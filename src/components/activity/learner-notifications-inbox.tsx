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
import { useEffect, useMemo, useState, useTransition } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { useGuardedAction } from "@/hooks/use-guarded-action";
import { FRIENDLY_MESSAGES } from "@/lib/friendly-error";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {FilterChip} from "@/components/ui/filter-chip";
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
  const [refreshing,startRefresh]=useTransition();
  // Bounded recipient-scoped refresh matches the old SSE arrival expectation
  // without opening a cross-tenant subscription. Next re-authorizes every read.
  useEffect(()=>{
    const refresh=()=>{
      if(document.visibilityState==="visible")startRefresh(()=>router.refresh());
    };
    const timer=window.setInterval(refresh,45000);
    window.addEventListener("focus",refresh);
    document.addEventListener("visibilitychange",refresh);
    return ()=>{
      window.clearInterval(timer);
      window.removeEventListener("focus",refresh);
      document.removeEventListener("visibilitychange",refresh);
    };
  },[router]);
  const refreshInbox=()=>startRefresh(()=>router.refresh());
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
    <section className="min-w-0 space-y-[var(--lms-space-4)]" aria-label="Learner notifications inbox">
      <p role="status" className="break-words text-sm text-body min-[768px]:hidden leading-[22px]">{mobileSummary}</p>
      <nav aria-label="Filter notifications by type" className="min-w-0">
        <div className="flex min-w-0 gap-2 overflow-x-auto pb-2 min-[768px]:flex-wrap min-[768px]:overflow-visible min-[768px]:pb-0">
          {learnerNotificationCategories.map(({ key, label }) => (
            <FilterChip
              key={key}
              type="button"
              aria-pressed={active === key}
              onClick={() => selectCategory(key)}
              className={"!min-h-11 shrink-0 rounded-[8px] px-4 py-2 !text-[14px] !font-medium !leading-[1.3] whitespace-nowrap focus-visible:!outline-offset-2 focus-visible:!outline-[var(--lms-primary)] "+
                (active===key
                  ? "!border-[var(--lms-primary)] !bg-[var(--lms-primary)] !text-white enabled:hover:!border-[var(--lms-primary-hover)] enabled:hover:!bg-[var(--lms-primary-hover)] enabled:hover:!text-white"
                  : "!border-[var(--lms-canvas-border)] !bg-transparent !text-[var(--lms-neutral-500)] enabled:hover:!border-[rgba(38,186,199,0.4)] enabled:hover:!bg-[rgba(38,186,199,0.05)] enabled:hover:!text-[var(--lms-primary)]")}
            >
              {label}
            </FilterChip>
          ))}
        </div>
      </nav>
      <div className="grid min-w-0 grid-cols-2 items-end gap-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-3)] min-[768px]:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <label className="col-span-2 min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] min-[768px]:col-span-1">
          Search notifications
          <Input type="search" value={search} maxLength={100}
            onChange={event=>setSearch(event.target.value)}
            onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();applySearch();}}}
            placeholder="Search title or message"
            className="mt-[var(--lms-space-2)] min-h-11 w-full md:min-h-[var(--lms-control-height)]"/>
        </label>
        <FilterChip type="button" aria-pressed={unread==="unread"}
          onClick={()=>selectUnread(unread==="unread"?"all":"unread")}
          className={"!min-h-11 w-full min-[768px]:w-auto rounded-[8px] px-4 py-2 !text-[14px] !font-medium !leading-[1.3] "+
            (unread==="unread"
              ? "!border-[var(--lms-primary)] !bg-[var(--lms-primary)] !text-white enabled:hover:!border-[var(--lms-primary-hover)] enabled:hover:!bg-[var(--lms-primary-hover)] enabled:hover:!text-white"
              : "!border-[var(--lms-canvas-border)] !bg-transparent !text-[var(--lms-neutral-500)] enabled:hover:!border-[rgba(38,186,199,0.4)] enabled:hover:!bg-[rgba(38,186,199,0.05)] enabled:hover:!text-[var(--lms-primary)]")}>
          {unread==="unread"?"Unread only ✓":"Unread only"}
        </FilterChip>
        <Button type="button" onClick={applySearch}
          variant="secondary" className="min-h-11 w-full min-[768px]:min-h-[var(--lms-control-height)] min-[768px]:w-auto">
          Apply search
        </Button>
        <Button type="button" disabled={!filtered} onClick={resetFilters}
          variant="secondary" className="col-span-2 min-h-11 w-full min-[768px]:col-span-1 min-[768px]:min-h-[var(--lms-control-height)] min-[768px]:w-auto">
          Clear filters
        </Button>
      </div>
      {unreadPersonalCount>0 ? (
        <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] border-b border-border py-[var(--lms-space-3)] min-[768px]:flex-row min-[768px]:items-center min-[768px]:justify-between">
          <p className="text-sm text-body leading-[22px]">{unreadPersonalCount} unread personal notifications</p>
          <Button variant="secondary" size="sm" className="min-h-11 w-full min-[768px]:min-h-[var(--lms-control-height)] min-[768px]:w-auto" onClick={()=>{setMarkAllError(null);setConfirmReadAll(true);}}>
            Mark all personal as read
          </Button>
        </div>
      ):null}
      <div className="flex min-w-0 flex-col items-start justify-between gap-[var(--lms-space-2)] md:flex-row md:items-center">
        <p role="status" className="text-sm text-body leading-[22px]">Showing {visible.length} of {combined.length} loaded notifications in this filtered view.</p>
        <div className="flex min-w-0 w-full flex-wrap items-center gap-3 md:w-auto">
          <Button type="button" variant="secondary" size="sm" disabled={refreshing}
            className="min-h-11 w-full md:w-auto md:min-h-9" onClick={refreshInbox}>
            {refreshing?"Refreshing notifications…":"Refresh"}
          </Button>
          <Link href="/learn/notifications/history" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-2 hover:text-[var(--lms-primary-text)] md:min-h-9">Browse personal history</Link>
        </div>
      </div>
      <p className="max-w-3xl text-xs leading-5 text-muted-foreground">College announcements have no personal read status. {learnerNotificationPreviewNotice(personal.length,60)}</p>

      {sourceStatus.state==="PARTIAL" ? (
        <div role="alert" className="border-y border-border py-[var(--lms-space-3)] text-sm text-body">
          <p className="font-semibold text-foreground">Couldn't load college announcements</p>
          <p className="mt-1">Your personal notifications are still available. {sourceStatus.notice}</p>
          <Button size="sm" variant="secondary" disabled={refreshing}
            className="min-h-11 w-full md:w-auto md:min-h-9" onClick={refreshInbox}>
            {refreshing?"Refreshing notifications…":"Retry announcements"}
          </Button>
        </div>
      ):null}
      {!announcementsEnabled && (active === "all" || active === "general") ? (
        <div role="status" className="border-y border-border py-[var(--lms-space-3)] text-sm text-body">
          College announcements are temporarily unavailable while their
          database rollout is being verified. Personal notifications remain available.
        </div>
      ) : null}
      <div className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] [&_article]:min-w-0 [&_article]:break-words [&_article_a]:max-w-full">
      {visible.length === 0 ? (
        <div className="space-y-3">
          <NotificationList items={[]} readEndpoint="/api/learn/notifications" emptyText={
            learnerInboxEmptyLabel({total:combined.length,category:active,unread,search})
          } />
          {filtered ? (
            <Button type="button" onClick={resetFilters}
              variant="ghost" className="min-h-11 w-full md:w-auto md:min-h-9 underline">
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
        dismissible={!markingAll}
        footer={<div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] min-[768px]:flex-row min-[768px]:justify-end [&>button]:w-full min-[768px]:[&>button]:w-auto">
          <Button variant="secondary" disabled={markingAll} onClick={()=>setConfirmReadAll(false)}>Keep unread</Button>
          <Button disabled={markingAll} onClick={()=>void markAllRead()}>
            {markingAll?"Updating…":"Confirm mark all read"}
          </Button>
        </div>}>
        {markAllError?<p role="alert" className="max-w-prose break-words text-sm text-error leading-[22px]">{markAllError}</p>:null}
      </Dialog>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
        title={selected?.title ?? "Notification"}
        
        description={selected?.source === "ANNOUNCEMENT" ? "College announcement" : "Personal notification"}
        footer={
          <div className="flex w-full flex-col gap-[var(--lms-space-2)] min-[768px]:flex-row min-[768px]:flex-wrap min-[768px]:justify-end">
            {learnerNotificationPlacementAction(selected?.actionHref) ? (
              <Link
                href={learnerNotificationPlacementAction(selected?.actionHref)!.href}
                onClick={() => setSelected(null)}
                className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-surface px-4 text-center text-sm font-[650] text-primary-text min-[768px]:w-auto md:min-h-9"
              >
                {learnerNotificationPlacementAction(selected?.actionHref)?.label??"Open details"}
              </Link>
            ) : null}
            {selected?.source==="ANNOUNCEMENT"&&selected.externalCta?
              <a href={selected.externalCta.href} target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-primary px-4 text-sm font-[650] text-primary-text md:w-auto md:min-h-9">
                {selected.externalCta.label} ↗
              </a>:null}
            <Button className="w-full min-[768px]:w-auto max-[767px]:min-h-11" onClick={() => setSelected(null)}>Got it</Button>
          </div>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap break-words text-[16px] leading-[1.6] text-[var(--lms-neutral-900)]">
              {selected.body}
            </p>
            <div className="flex flex-wrap gap-2 text-[14px] leading-[1.4] text-muted-foreground">
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
