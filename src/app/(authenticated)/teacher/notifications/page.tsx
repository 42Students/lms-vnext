import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  NotificationList,
  type NotificationListItem,
} from "@/components/activity/notification-list";
import { NotificationToolbar } from "@/components/activity/notification-toolbar";

import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { AuthorizationError } from "@/modules/permissions/policy";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { listVisibleAnnouncementsForMembershipPage } from "@/modules/announcements/service";
import {
  countOwnUnreadNotifications,
  listOwnNotificationPage,
} from "@/modules/activity/notification-service";
import { parseFacultyInboxQuery,normalizeFacultyLegacyInboxTab } from "@/modules/courses/faculty-inbox-query-model";
import { facultyNotificationActionHref } from "@/modules/courses/faculty-notification-link-model";
import { facultyNotificationsFallbackPath,requireFacultyNotificationsAccess } from "@/modules/activity/faculty-notifications-access";
import { FacultyNotificationsRetry } from "./faculty-notifications-retry";

const FACULTY_INBOX = "/teacher/notifications";

export default async function FacultyNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string | string[];
    tab?: string | string[];
    beforeCreatedAt?: string | string[];
    beforeId?: string | string[];
    beforeNoticeCreatedAt?: string | string[];
    beforeNoticeId?: string | string[];
    beforeNoticePinned?: string | string[];
  }>;
}) {
  const context = await getCurrentRequestContext();
  let membership:ReturnType<typeof requireFacultyNotificationsAccess>;
  try{membership=requireFacultyNotificationsAccess(context);}
  catch(error){
    if(error instanceof AuthorizationError)redirect(facultyNotificationsFallbackPath(context));
    throw error;
  }

  const { tab, ...query } = await searchParams;
  const legacyTab=normalizeFacultyLegacyInboxTab(tab);
  // Historic invalid tabs canonicalize, but invalid cursor tuples still fail
  // closed in parseFacultyInboxQuery rather than expanding a private inbox.
  if(legacyTab.needsCanonicalRedirect)redirect(FACULTY_INBOX+"?view=all");
  const scopeTab=legacyTab.tab;
  const { view, cursor, noticeCursor, invalid } = parseFacultyInboxQuery(query);
  const announcementsEnabled = announcementsRuntimeEnabled();
  // Announcements have no recipient-owned read receipt. Never present them
  // as unread personal notifications or imply "mark all" can acknowledge them.
  const showPersonal = scopeTab === "all" || scopeTab === "personal";
  const showAnnouncements = view === "all" && scopeTab !== "personal";
  const [notificationRead, unreadRead, announcementRead] = await Promise.all([
    (invalid || !showPersonal
      ? Promise.resolve({ items: [], nextCursor: null })
      : listOwnNotificationPage(context, {
          limit: 50,
          unreadOnly: view === "unread",
          collegeId: membership.collegeId,
          ...(cursor ?? {}),
        })).then(value=>({available:true as const,value}))
          .catch(error=>{
            if(error instanceof AuthorizationError)throw error;
            return {available:false as const,value:{items:[],nextCursor:null}};
          }),
    countOwnUnreadNotifications(context, { collegeId: membership.collegeId })
      .then(value => ({ available: true as const, value }))
      .catch(error => {
        if (error instanceof AuthorizationError) throw error;
        return { available: false as const, value: 0 };
      }),
    announcementsEnabled && showAnnouncements && !invalid
      ? listVisibleAnnouncementsForMembershipPage(context, new Date(), noticeCursor ?? undefined)
          .then(value => ({ available: true as const, ...value }))
          .catch(error => {
            if (error instanceof AuthorizationError) throw error;
            return { available: false as const, items: [], nextCursor: null };
          })
      : Promise.resolve({ available: true as const, items: [], nextCursor: null }),
  ]);
  const page=notificationRead.value;
  const unreadCount = unreadRead.value;
  const announcements = announcementRead.items.filter(item =>
    scopeTab === "all" ||
    (scopeTab !== "personal" && item.receiverType.toLowerCase() === scopeTab),
  );

  const queryPrefix = {
    view,
    ...(scopeTab !== "all" ? { tab: scopeTab } : {}),
    ...(cursor ? {
      beforeCreatedAt: cursor.beforeCreatedAt.toISOString(),
      beforeId: cursor.beforeId,
    } : {}),
    ...(noticeCursor ? {
      beforeNoticeCreatedAt: noticeCursor.createdAt.toISOString(),
      beforeNoticeId: noticeCursor.id,
      beforeNoticePinned: noticeCursor.isPinned ? "1" : "0",
    } : {}),
  };
  const nextHref = !invalid && showPersonal && notificationRead.available && page.nextCursor
    ? FACULTY_INBOX + "?" + new URLSearchParams({
        ...queryPrefix,
        beforeCreatedAt: page.nextCursor.beforeCreatedAt.toISOString(),
        beforeId: page.nextCursor.beforeId,
      }).toString()
    : null;
  const nextNoticeHref = !invalid && showAnnouncements && announcementRead.available &&
    announcementRead.nextCursor
    ? FACULTY_INBOX + "?" + new URLSearchParams({
        ...queryPrefix,
        beforeNoticeCreatedAt: announcementRead.nextCursor.createdAt.toISOString(),
        beforeNoticeId: announcementRead.nextCursor.id,
        beforeNoticePinned: announcementRead.nextCursor.isPinned ? "1" : "0",
      }).toString()
    : null;

  const items: NotificationListItem[] = page.items.map(({ notification, event }) => ({
    id: notification.id,
    title: notification.title?.trim() || "Notification",
    body: notification.body,
    actionHref: facultyNotificationActionHref(notification.actionHref),
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
    module: event.module,
    contextLine: event.module?.replaceAll("_"," ")||"—",
    importance: event.importance,
  }));

  const announcementItems:NotificationListItem[]=announcements.map(item=>({
    id:"announcement-"+item.id,title:item.title?.trim()||"Notification",
    body:item.message,actionHref:null,readAt:null,
    createdAt:new Date(item.createdAt).toISOString(),
    module:"ANNOUNCEMENT",importance:item.isPinned?"HIGH":"NORMAL",
    source:"ANNOUNCEMENT",pinned:item.isPinned,
    contextLine:(item.receiverType||"College").replaceAll("_"," ")+" announcement",
  }));
  const feed = (invalid ? [] : scopeTab === "personal" ? items
    : scopeTab === "all" ? [...items, ...announcementItems] : announcementItems)
    .sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)||b.id.localeCompare(a.id));
  const failedFeed = (!notificationRead.available && showPersonal) ||
    (!announcementRead.available && showAnnouncements);
  const allEmpty = feed.length === 0 && !invalid && !failedFeed &&
    view === "all" && scopeTab === "all";
  return (
    <div className="min-w-0 max-w-full space-y-6">
      <PageHeader title="Notifications" />
      <NotificationToolbar view={view} unreadCount={unreadCount} baseHref={FACULTY_INBOX}
        markAllEndpoint="/api/notifications/faculty/read-all" categoryParam="tab" selectedCategory={scopeTab}
        categories={[
         {id:"all",label:"All",unread:page.items.length+announcementRead.items.length},
         {id:"college",label:"College",unread:announcementRead.items.filter(item=>item.receiverType.toLowerCase()==="college").length},
         {id:"department",label:"Department",unread:announcementRead.items.filter(item=>item.receiverType.toLowerCase()==="department").length},
         {id:"faculty",label:"Faculty",unread:announcementRead.items.filter(item=>item.receiverType.toLowerCase()==="faculty").length},
         {id:"personal",label:"Personal",unread:page.items.length},
        ]}/>
      {!unreadRead.available?<Alert tone="warning">
        Unread counts are temporarily unavailable. The message list may still be available.
        <FacultyNotificationsRetry />
      </Alert>:null}
      {!notificationRead.available && showPersonal?<Alert tone="error">
        <strong>Couldn't load notifications.</strong> Personal notifications could not be loaded.
        <FacultyNotificationsRetry />
      </Alert>:null}
      {showAnnouncements && announcementsEnabled && !announcementRead.available?<Alert tone="warning">
        Couldn't load college announcements. Personal notifications remain available.
        <FacultyNotificationsRetry />
      </Alert>:null}
      {invalid?<Alert tone="error">
        The notification filters or page link are invalid.
        <Link href={FACULTY_INBOX+"?view="+view}
          className="ml-2 inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">View all notifications</Link>
      </Alert>:null}
      <section aria-labelledby="faculty-feed-heading" className="min-w-0 space-y-4">
        <h2 id="faculty-feed-heading" className="text-lg font-semibold text-[var(--lms-heading)]">
          {scopeTab==="all"?"Notifications":scopeTab==="personal"?"Personal notifications":
            scopeTab.charAt(0).toUpperCase()+scopeTab.slice(1)+" notifications"}
        </h2>
        {allEmpty?<p className="text-sm text-body">Announcements across college, department, and faculty will appear here.</p>:null}
        {view === "unread" && scopeTab !== "personal" && scopeTab !== "all" ?
          <p role="status" className="text-sm text-body">Announcements have no read status. Select All to view {scopeTab} announcements, or Personal for unread messages.</p> : null}
        {!invalid && (!failedFeed || feed.length > 0) ?
        <NotificationList readEndpoint="/api/notifications/faculty" items={feed}
          emptyText={allEmpty?"No notifications yet":view==="unread"?"No unread notifications yet":
            "No "+(scopeTab==="all"?"new":scopeTab)+" notifications yet"}
          emptyAction={feed.length===0&&!allEmpty?<Link href={FACULTY_INBOX+"?view=all"}
            className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            View all
          </Link>:null}/> : null}
        {nextHref ? <div className="flex justify-start">
          <Link href={nextHref} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Older notifications
          </Link>
        </div>:null}
        {nextNoticeHref ? <div className="flex justify-start">
          <Link href={nextNoticeHref} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Older announcements
          </Link>
        </div> : null}
      </section>
    </div>
  );
}
