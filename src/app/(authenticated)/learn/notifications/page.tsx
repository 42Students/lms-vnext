import { Suspense } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { getCurrentRequestContext } from "@/auth/request-context";
import type { NotificationListItem } from "@/components/activity/notification-list";
import { PageHeader } from "@/components/ui/page-header";
import { LearnerNotificationsInbox } from "@/components/activity/learner-notifications-inbox";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { listVisibleAnnouncementsForMembership } from "@/modules/announcements/service";
import { listOwnNotifications } from "@/modules/activity/notification-service";
import { requirePersistedLearnerNotificationMembership } from "@/modules/activity/learner-notification-membership-service";
import { learnerNotificationInboxHref, learnerNotificationInboxQuerySchema } from "@/modules/activity/learner-notification-inbox-model";
import { notFound, redirect } from "next/navigation";
import { AuthorizationError } from "@/modules/permissions/policy";

function NotificationsLoading() {
  return <div className="min-w-0 space-y-4" aria-busy="true" aria-label="Loading notifications">
    <PageHeader title="Notifications"/>
    <div className="flex gap-2" aria-hidden="true"><span className="h-8 w-24 animate-pulse rounded-lg bg-muted"/><span className="h-8 w-24 animate-pulse rounded-lg bg-muted"/></div>
    <ul className="space-y-2" aria-hidden="true">{[1,2,3,4,5].map(id=><li key={id}
      className="flex items-start gap-3 rounded-lg border border-border px-4 py-3">
      <span className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-muted"/>
      <div className="w-full space-y-2"><span className="block h-4 w-2/5 animate-pulse rounded bg-muted"/><span className="block h-3 w-4/5 animate-pulse rounded bg-muted"/></div>
    </li>)}</ul>
  </div>;
}

type LearnerNotificationParams={category?:string|string[];tab?:string|string[];unread?:string|string[];q?:string|string[]};

export default function NotificationsPage({searchParams}:{
  searchParams:Promise<LearnerNotificationParams>;
}) {
  return <Suspense fallback={<NotificationsLoading/>}>
    <LearnerNotificationsContent searchParams={searchParams}/>
  </Suspense>;
}

async function LearnerNotificationsContent({searchParams}:{searchParams:Promise<LearnerNotificationParams>}) {
  const { tab, ...filters } = await searchParams;
  const oldTab=Array.isArray(tab)?tab[0]:tab;
  // Legacy bad ?tab values returned to All rather than aborting the inbox.
  const allowed=new Set(["all","course","project","general","job"]);
  const legacyCategory=oldTab&&allowed.has(oldTab)?oldTab:"all";
  const normalizedTab=tab===undefined?undefined:legacyCategory;
  const query = learnerNotificationInboxQuerySchema.safeParse(
    normalizedTab === undefined ? filters : {...filters,category:normalizedTab},
  );
  if (!query.success) notFound();
  const context =
    await getCurrentRequestContext();
  const membership = await requirePersistedLearnerNotificationMembership(context);
  // Authorize the selected learner membership before redirecting an old link.
  if (tab !== undefined) redirect(learnerNotificationInboxHref(query.data));
  const announcementsEnabled =
    announcementsRuntimeEnabled();
  // Personal notifications are required. A failed announcement source must
  // not turn a healthy personal inbox into an empty state or hard error.
  let personalLoadFailed=false;
  const rows = await listOwnNotifications(context,{
    limit:60,collegeId:membership.collegeId,
  }).catch((error:unknown)=>{
    if(error instanceof AuthorizationError)throw error;
    personalLoadFailed=true;
    return [] as Awaited<ReturnType<typeof listOwnNotifications>>;
  });
  let announcements:Awaited<ReturnType<typeof listVisibleAnnouncementsForMembership>>=[];
  let announcementsLoadFailed=false;
  if(announcementsEnabled){
    try {
      announcements=await listVisibleAnnouncementsForMembership(context);
    }catch(error){
      if(error instanceof AuthorizationError)throw error;
      announcementsLoadFailed=true;
    }
  }

  const items: NotificationListItem[] =
    rows.map(
      ({
        notification,
        event,
      }) => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        actionHref:
          notification.actionHref,
        readAt:
          notification.readAt?.toISOString() ??
          null,
        createdAt:
          notification.createdAt.toISOString(),
        module: event.module,
        importance:
          event.importance,
      }),
    );

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader title="Notifications"/>
      {personalLoadFailed?<Alert tone="warning" role="alert" title="Personal notifications could not be loaded">
        This is a loading problem, not an empty inbox. Your college announcements below are still available.
        <Link href={learnerNotificationInboxHref(query.data)} className="ml-2 font-semibold text-primary-text underline">Retry personal notifications</Link>
      </Alert>:null}
      <LearnerNotificationsInbox
        key={query.data.category+":"+query.data.unread+":"+query.data.q}
        personal={items}
        initialFilters={query.data}
        announcementsEnabled={announcementsEnabled}
        announcementsLoadFailed={announcementsLoadFailed}
        announcements={announcements.map((announcement) => ({
          id: announcement.id,
          title: announcement.title,
          message: announcement.message,
          senderType: announcement.senderType,
          receiverType: announcement.receiverType,
          isPinned: announcement.isPinned,
          buttonLabel:announcement.buttonLabel,
          buttonUrl:announcement.buttonUrl,
          createdAt: announcement.createdAt,
        }))}
      />
    </div>
  );
}
