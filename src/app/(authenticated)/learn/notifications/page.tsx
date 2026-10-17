import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import type { NotificationListItem } from "@/components/activity/notification-list";
import { PageHeader } from "@/components/ui/page-header";
import { LearnerNotificationsInbox } from "@/components/activity/learner-notifications-inbox";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { listVisibleAnnouncementsForMembership } from "@/modules/announcements/service";
import { listOwnNotifications } from "@/modules/activity/notification-service";
import { requirePersistedLearnerNotificationMembership } from "@/modules/activity/learner-notification-membership-service";
import { learnerNotificationInboxQuerySchema } from "@/modules/activity/learner-notification-inbox-model";
import { notFound } from "next/navigation";
import { AuthorizationError } from "@/modules/permissions/policy";

export default async function NotificationsPage({searchParams}:{
  searchParams:Promise<{category?:string|string[];unread?:string|string[];q?:string|string[]}>;
}) {
  const query=learnerNotificationInboxQuerySchema.safeParse(await searchParams);
  if (!query.success) notFound();
  const context =
    await getCurrentRequestContext();
  const membership = await requirePersistedLearnerNotificationMembership(context);
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
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
      />
      <Link href="/learn/notifications/history"
        className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle">
        Browse older personal notifications →
      </Link>
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
