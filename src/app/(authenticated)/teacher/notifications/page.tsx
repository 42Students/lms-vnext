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
import { listVisibleAnnouncementsForMembership } from "@/modules/announcements/service";
import {
  countOwnUnreadNotifications,
  listOwnNotificationPage,
} from "@/modules/activity/notification-service";
import { parseFacultyInboxQuery,normalizeFacultyLegacyInboxTab } from "@/modules/courses/faculty-inbox-query-model";
import { facultyNotificationActionHref } from "@/modules/courses/faculty-notification-link-model";
import { facultyNotificationsFallbackPath,requireFacultyNotificationsAccess } from "@/modules/activity/faculty-notifications-access";

const FACULTY_INBOX = "/teacher/notifications";

export default async function FacultyNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string | string[];
    tab?: string | string[];
    beforeCreatedAt?: string | string[];
    beforeId?: string | string[];
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
  const { view, cursor, invalid } = parseFacultyInboxQuery(query);
  const announcementsEnabled = announcementsRuntimeEnabled();
  // The legacy inbox keeps college announcements visible when the personal
  // feed fails. Isolate all three reads, but never swallow permission failures.
  const [personalRead, countRead, announcementsResult] = await Promise.allSettled([
    invalid
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
    countOwnUnreadNotifications(context, { collegeId: membership.collegeId }),
    announcementsEnabled
      ? listVisibleAnnouncementsForMembership(context)
      : Promise.resolve([]),
  ]);
  for (const read of [personalRead, countRead, announcementsResult]) {
    if (read.status === "rejected" && read.reason instanceof AuthorizationError)
      throw read.reason;
  }
  const personalFailed = personalRead.status === "rejected" ||
    countRead.status === "rejected";
  const page = personalRead.status === "fulfilled"
    ? personalRead.value : { items: [], nextCursor: null };
  const unreadCount = countRead.status === "fulfilled" ? countRead.value : 0;
  const announcementRead = announcementsResult.status === "fulfilled"
    ? { available: announcementsEnabled, items: announcementsResult.value }
    : { available: false, items: [] as Awaited<ReturnType<typeof listVisibleAnnouncementsForMembership>> };
  const announcements = announcementRead.items.filter(item =>
    scopeTab === "all" ||
    (scopeTab !== "personal" && item.receiverType.toLowerCase() === scopeTab),
  );

  const nextHref = page.nextCursor
    ? FACULTY_INBOX + "?" + new URLSearchParams({
        view,
        ...(scopeTab !== "all" ? { tab: scopeTab } : {}),
        beforeCreatedAt: page.nextCursor.beforeCreatedAt.toISOString(),
        beforeId: page.nextCursor.beforeId,
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
  const feed=(scopeTab==="personal"?items:scopeTab==="all"?[...items,...announcementItems]:announcementItems)
    .sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
  const allEmpty=feed.length===0 && view==="all" && scopeTab==="all";
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
      {personalFailed && (scopeTab === "all" || scopeTab === "personal") ? (
        <Alert tone="warning">
          Some notifications could not be loaded
          <Link href={FACULTY_INBOX + "?view=" + view +
            (scopeTab !== "all" ? "&tab=" + encodeURIComponent(scopeTab) : "")}
            className="ml-2 font-semibold text-primary-text underline">Retry</Link>
        </Alert>
      ) : null}
      {scopeTab === "all" || scopeTab === "personal" ? (
      <section aria-labelledby="faculty-personal-notifications" className="space-y-4">
        <h2 id="faculty-personal-notifications" className="text-lg font-semibold leading-7 text-[var(--lms-heading)]">
          Personal notifications
        </h2>
        {allEmpty?<p className="text-sm text-body">Announcements across college, department, and faculty will appear here.</p>:null}
        <NotificationList readEndpoint="/api/notifications/faculty" items={feed}
          emptyText={allEmpty?"No notifications yet":view==="unread"?"No unread notifications yet":
            "No "+(scopeTab==="all"?"new":scopeTab)+" notifications yet"}
          emptyAction={feed.length===0&&!allEmpty?<Link href={FACULTY_INBOX+"?view=all"}
            className="inline-flex min-h-11 items-center font-semibold text-link underline">
            View all
          </Link>:null}/>
        {nextHref&&(scopeTab==="personal"||scopeTab==="all")?<div className="flex justify-start">
          <Link href={nextHref} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link hover:bg-primary-subtle">
            Older notifications
          </Link>
        </div>:null}
      </section>
    </div>
  );
}
