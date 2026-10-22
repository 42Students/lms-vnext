import { Suspense } from "react";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courses,departments} from "@/db/schema";
import { z } from "zod";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { getCurrentRequestContext } from "@/auth/request-context";
import type { NotificationListItem } from "@/components/activity/notification-list";
import { PageHeader } from "@/components/ui/page-header";
import { LearnerNotificationsInbox } from "@/components/activity/learner-notifications-inbox";
import { announcementsRuntimeEnabled } from "@/modules/announcements/readiness";
import { listVisibleAnnouncementsForMembership } from "@/modules/announcements/service";
import { listOwnNotificationPage } from "@/modules/activity/notification-service";
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

type LearnerNotificationParams={
 category?:string|string[];tab?:string|string[];
 unread?:string|string[];q?:string|string[];
 classId?:string|string[];courseId?:string|string[];courseSlug?:string|string[];
 beforeCreatedAt?:string|string[];beforeId?:string|string[];
};

export default function NotificationsPage({searchParams}:{
  searchParams:Promise<LearnerNotificationParams>;
}) {
  return <Suspense fallback={<NotificationsLoading/>}>
    <LearnerNotificationsContent searchParams={searchParams}/>
  </Suspense>;
}

async function LearnerNotificationsContent({searchParams}:{searchParams:Promise<LearnerNotificationParams>}) {
  const { tab,beforeCreatedAt,beforeId,...filters } = await searchParams;
  // Use the existing keyset reader so a personal inbox never ends at its
  // first 60 messages. Both cursor dimensions must arrive together.
  if(Boolean(beforeCreatedAt)!==Boolean(beforeId)||
     Array.isArray(beforeCreatedAt)||Array.isArray(beforeId))notFound();
  const cursorDate=typeof beforeCreatedAt==="string"
    ? z.iso.datetime({offset:true}).safeParse(beforeCreatedAt) : null;
  const cursorId=typeof beforeId==="string"
    ? z.string().uuid().safeParse(beforeId) : null;
  if((cursorDate&&!cursorDate.success)||(cursorId&&!cursorId.success))notFound();
  // Do not silently let a legacy tab overwrite a canonical category, and do
  // not accept duplicated tab selectors that could mean different categories.
  if (tab !== undefined && (filters.category !== undefined || Array.isArray(tab))) notFound();
  const oldTab=typeof tab==="string"?tab:undefined;
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
  // Match legacy courseSlug precedence only within this learner's college.
  // These selectors never change recipient identity or membership scope.
  let selectedCourseId=query.data.courseId;
  if(query.data.courseSlug){
    const [course]=await getDb().select({id:courses.id}).from(courses)
      .innerJoin(departments,eq(departments.id,courses.departmentId))
      .where(and(eq(departments.collegeId,membership.collegeId),
        sql`lower(${courses.slug})=${query.data.courseSlug.toLowerCase()}`))
      .limit(1);
    if(!course)notFound();
    selectedCourseId=course.id;
  }
  const scopedInbox=Boolean(query.data.classId||selectedCourseId);
  const announcementsEnabled =
    announcementsRuntimeEnabled()&&!scopedInbox;
  // Personal notifications are required. A failed announcement source must
  // not turn a healthy personal inbox into an empty state or hard error.
  let personalLoadFailed=false;
  let personalPage: Awaited<ReturnType<typeof listOwnNotificationPage>>;
  try {
    personalPage = await listOwnNotificationPage(context,{
      limit:60,collegeId:membership.collegeId,
      ...(query.data.classId!==undefined?{classId:query.data.classId}:{}),
      ...(selectedCourseId!==undefined?{courseId:selectedCourseId}:{}),
      ...(cursorDate?.success&&cursorId?.success?{
        beforeCreatedAt:new Date(cursorDate.data),beforeId:cursorId.data,
      }:{}),
    });
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) throw error;
    personalLoadFailed = true;
    personalPage = {items:[],nextCursor:null};
  }
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
    personalPage.items.map(
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
        key={query.data.category+":"+query.data.unread+":"+query.data.q+":"+(beforeId??"")}
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
      {personalPage.nextCursor?<Link
        className="inline-flex min-h-11 items-center rounded-md border border-border px-4 font-semibold text-link underline underline-offset-4"
        href={(()=>{
          const base=new URL(learnerNotificationInboxHref(query.data),"https://lms.local");
          base.searchParams.set("beforeCreatedAt",personalPage.nextCursor!.beforeCreatedAt.toISOString());
          base.searchParams.set("beforeId",personalPage.nextCursor!.beforeId);
          return base.pathname+base.search;
        })()}>
        Older personal notifications
      </Link>:null}
      {beforeId?<Link
        className="ml-3 inline-flex min-h-11 items-center text-link underline underline-offset-4"
        href={learnerNotificationInboxHref(query.data)}>
        Newest notifications
      </Link>:null}
    </div>
  );
}
