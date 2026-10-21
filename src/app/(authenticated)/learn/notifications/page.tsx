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

export default async function NotificationsPage({searchParams}:{
  searchParams:Promise<{category?:string|string[];tab?:string|string[];unread?:string|string[];q?:string|string[]}>;
}) {
  const { tab, ...filters } = await searchParams;
  // Old LMS links persist the selected tab as ?tab=. Keep that deep link
  // working, but accept only known inbox categories and canonicalize the URL.
  if (tab !== undefined && filters.category !== undefined && filters.category !== tab) {
    notFound();
  }
  const query = learnerNotificationInboxQuerySchema.safeParse(
    tab === undefined ? filters : { ...filters, category: tab },
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
  const rows = await listOwnNotifications(context,{
    limit:60,collegeId:membership.collegeId,
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
      <PageHeader title="Notifications" description="Your personal updates and college announcements."/>
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
