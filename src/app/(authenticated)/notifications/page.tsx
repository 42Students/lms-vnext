import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  NotificationList,
  type NotificationListItem,
} from "@/components/activity/notification-list";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listVisibleAnnouncementsForMembership } from "@/modules/announcements/service";
import { Alert } from "@/components/ui/alert";
import { NotificationToolbar } from "@/components/activity/notification-toolbar";
import { countOwnUnreadNotifications, listOwnNotificationPage } from "@/modules/activity/notification-service";
import { parseNotificationCursor } from "@/modules/activity/notification-cursor";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; beforeCreatedAt?: string; beforeId?: string;
    q?: string; classId?: string; courseId?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "unread" ? "unread" : "all";
  const context = await getCurrentRequestContext();
  const q=(params.q??"").trim();
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const invalidScope=Boolean(params.classId&&params.courseId) ||
    Boolean(params.classId&&!uuid.test(params.classId)) ||
    Boolean(params.courseId&&!uuid.test(params.courseId)) || q.length>100;
  const newest=!params.beforeCreatedAt&&!params.beforeId;
  const filters={
    ...(params.classId?{classId:params.classId}:{}),
    ...(params.courseId?{courseId:params.courseId}:{}),
    ...(q?{query:q}:{}),
  };
  const parsedCursor = parseNotificationCursor({
    beforeCreatedAt: params.beforeCreatedAt,
    beforeId: params.beforeId,
  });
  const [notificationResult, announcementResult, unreadResult] = await Promise.allSettled([
    (parsedCursor.invalid||invalidScope)
      ? Promise.resolve({items:[],nextCursor:null})
      : listOwnNotificationPage(context,{
          limit:50,unreadOnly:view==="unread",
          ...(parsedCursor.cursor??{}),...filters,
        }),
    !invalidScope && view==="all" && newest && !params.classId && !params.courseId
      ? listVisibleAnnouncementsForMembership(context,new Date(),{limit:75})
      : Promise.resolve([]),
    countOwnUnreadNotifications(context),
  ]);
  const page=notificationResult.status==="fulfilled"
    ? notificationResult.value:{items:[],nextCursor:null};
  const unreadCount=unreadResult.status==="fulfilled"?unreadResult.value:0;
  const announcements=announcementResult.status==="fulfilled"?announcementResult.value:[];
  const partialFailure=notificationResult.status==="rejected"||
    announcementResult.status==="rejected"||unreadResult.status==="rejected";
  const baseParams=new URLSearchParams({view});
  if(q)baseParams.set("q",q);
  if(params.classId)baseParams.set("classId",params.classId);
  if(params.courseId)baseParams.set("courseId",params.courseId);
  const retryHref="/notifications?"+baseParams.toString();
  const nextHref = page.nextCursor
    ? "/notifications?" + new URLSearchParams({
        ...Object.fromEntries(baseParams.entries()),
        beforeCreatedAt:page.nextCursor.beforeCreatedAt.toISOString(),
        beforeId:page.nextCursor.beforeId,
      }).toString()
    : null;
  const items:NotificationListItem[]=[
    ...page.items.map(({notification,event})=>({
      id:notification.id,
      title:notification.title,body:notification.body,
      actionHref:notification.actionHref,
      readAt:notification.readAt?.toISOString()??null,
      createdAt:notification.createdAt.toISOString(),
      module:event.module,importance:event.importance,
    })),
    ...announcements.filter(item=>!q ||
      item.title.toLocaleLowerCase().includes(q.toLocaleLowerCase())||
      item.message.toLocaleLowerCase().includes(q.toLocaleLowerCase()))
      .map(item=>({
        id:"announcement:"+item.id,
        title:item.title,body:item.message,
        actionHref:null,readAt:null,
        createdAt:item.createdAt.toISOString(),
        module:"ANNOUNCEMENTS",importance:item.isPinned?"HIGH":"NORMAL",
        source:"ANNOUNCEMENT" as const,pinned:item.isPinned,
        contextLine:item.receiverType.replaceAll("_"," ")+" announcement",
      })),
  ].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id));
  return (
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader
        title="Notifications"
        description="Deterministic workflow updates that need your attention, separate from noisy technical events."
      />
      <NotificationToolbar view={view} unreadCount={unreadCount} />
      <form method="get" action="/notifications" className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Input type="hidden" name="view" value={view}/>
        <label className="grid gap-2 text-sm font-semibold">Search notifications
          <Input type="search" name="q" maxLength={100} defaultValue={q} placeholder="Title or message"/>
        </label>
        <Button type="submit" className="min-h-11 self-end md:min-h-9">Search</Button>
        <label className="grid gap-2 text-sm font-semibold">Class ID (current workspace)
          <Input name="classId" defaultValue={params.classId??""} placeholder="Class UUID"/>
        </label>
        <label className="grid gap-2 text-sm font-semibold">Course ID (current workspace)
          <Input name="courseId" defaultValue={params.courseId??""} placeholder="Course UUID"/>
        </label>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          Use a Class or Course filter, not both. Only your authorized notifications are searched.
        </p>
      </form>
      {invalidScope?<Alert tone="error">Provide either classId or courseId, not both, and select a valid class or course.</Alert>:null}
      {partialFailure?<Alert tone="warning">
        Some notifications or announcements could not be loaded. Available items are still shown.
        {" "}<Link href={retryHref} className="font-semibold text-primary-text underline">Retry</Link>
      </Alert>:null}
      {parsedCursor.invalid ? (
        <Alert tone="error">
          The notification page link is invalid.{" "}
          <Link href={view === "unread" ? "/notifications?view=unread" : "/notifications?view=all"} className="font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">
            Return to the newest notifications
          </Link>
        </Alert>
      ) : invalidScope ? null : (
        <>
          <NotificationList
            items={items}
            emptyText={view === "unread" ? "No unread notifications." : "Nothing yet."}
            emptyAction={view === "unread" ? <Link href="/notifications?view=all" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9">All</Link> : null}
          />
          {nextHref ? (
            <div className="flex justify-center">
              <Link href={nextHref} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text min-[768px]:min-h-9 min-[768px]:w-auto hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                Older notifications
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
