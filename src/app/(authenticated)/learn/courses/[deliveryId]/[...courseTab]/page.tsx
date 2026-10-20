import { Banner } from "@/components/ui/banner";
import { LEARNER_BACK_TO_COURSES } from "@/modules/courses/learner-course-copy-model";
import type { ReactNode } from "react";
import Link from "next/link";
import { learnerCourseTabPath } from "@/modules/courses/learner-course-tab-route-model";
import {learnerCourseTabPersistentQuery} from "@/modules/courses/learner-course-tab-context-model";
import {LearnerCourseDocumentTitle} from "@/components/courses/learner-course-document-title";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerCourseAttendance } from "@/components/courses/learner-course-attendance";
import { LearnerCourseDiscussion } from "@/components/courses/learner-course-discussion";
import { LearnerCourseOverview } from "@/components/courses/learner-course-overview";
import { LearnerCourseTabs, learnerCourseTabs } from "@/components/courses/learner-course-tabs";
import { LearnerCourseWorkspace } from "@/components/courses/learner-course-workspace";
import { PageHeader } from "@/components/ui/page-header";
import { learnerCourseAttendanceIstMonth,learnerCourseAttendanceIstWindow } from "@/modules/attendance/learner-course-attendance-ist-model";
import { getLearnerAttendanceWorkspace } from "@/modules/attendance/learner-service";
import { learnerDiscussionScopeKey } from "@/modules/courses/learner-discussion-scope-key-model";
import {listLearnerCourseClassAnnouncements} from "@/modules/courses/learner-course-announcements-service";
import {readLearnerPlaybackSettings,LEARNER_PLAYBACK_DEFAULTS} from "@/modules/courses/learner-playback-settings";
import { loadCourseDisplayContentIfReady } from "@/modules/courses/course-display-service";
import {
  getLearnerCourseWorkspace,
  listLearnerCourseDeliveries,
  listLearnerCourseInstructors,
} from "@/modules/courses/learner-course-service";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LearnerCourseTabPage({
  params,
  searchParams,
}: {
  params: Promise<{
    deliveryId: string;
    courseTab: string[];
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { deliveryId, courseTab } = await params;
  const query = await searchParams;
  const activeTab = learnerCourseTabPath(courseTab, learnerCourseTabs.map((tab) => tab.path));
  if (activeTab === null) {
    // Legacy deep links with an unknown course tab resolve to Overview.
    // Keep query context, but never interpolate it into a path segment.
    const safeQuery=new URLSearchParams();
    for(const [key,value] of Object.entries(query).slice(0,20)){
      if(key.length>100)continue;
      const one=Array.isArray(value)?value[0]:value;
      if(typeof one==="string"&&one.length<=500)safeQuery.set(key,one);
    }
    const suffix=safeQuery.toString();
    redirect("/learn/courses/"+encodeURIComponent(deliveryId)+"/home"+(suffix?"?"+suffix:""));
  }

  const context = await getCurrentRequestContext();
  const [workspace, deliveries, instructors] = await Promise.all([
    getLearnerCourseWorkspace(context, deliveryId),
    listLearnerCourseDeliveries(
      context,
      { includeHistorical: true },
    ),
    listLearnerCourseInstructors(context, deliveryId),
  ]);

  const courseMeta = deliveries.find(
    (delivery) => delivery.deliveryId === deliveryId,
  );

  if (!courseMeta) {
    notFound();
  }

  const readOnly =
    Boolean(courseMeta.deliveryEndedAt) ||
    courseMeta.sectionEnrollmentStatus !== "ACTIVE" ||
    courseMeta.programEnrollmentStatus !== "ACTIVE" ||
    courseMeta.periodStatus === "CLOSED";

  let content: ReactNode;

  if (activeTab === "home") {
    const [announcements, display] =
      await Promise.all([
        listLearnerCourseClassAnnouncements(context,courseMeta.sectionId),
        loadCourseDisplayContentIfReady(workspace.course.id),
      ]);
    const courseUpdates = announcements.map(announcement=>({
      id:announcement.id,
      title:announcement.title,
      senderName:announcement.senderName?.trim()||"College staff",
      messageText:announcement.messageText,
      pinned:false,
      createdAt:announcement.createdAt,
    }));

    content = (
      <LearnerCourseOverview
        deliveryId={deliveryId}
        workspace={workspace}
        meta={{
          courseDescription: courseMeta.courseDescription,
          introductionText:
            display?.introductionText ?? null,
          bodyHtml:
            display?.bodyHtml ?? null,
          takeaways:
            display?.takeaways ?? [],
          offeringType: courseMeta.offeringType,
          credits: courseMeta.credits,
          sectionName: courseMeta.sectionName,
          sectionCode: courseMeta.sectionCode,
          academicPeriodName: courseMeta.academicPeriodName,
          instructors: instructors.map((instructor) => ({
            ...instructor,
            name: instructor.name?.trim() || "Instructor",
          })),
        }}
        readOnly={readOnly}
        courseUpdates={courseUpdates}
      />
    );
  } else if (activeTab === "roadmap") {
    content = (
      <LearnerCourseWorkspace
        deliveryId={deliveryId}
        workspace={workspace}
        filter={first(query.filter) ?? "all"}
        focusLessonId={first(query.lesson) ?? null}
        focusContentId={first(query.content) ?? null}
        readOnly={readOnly}
      />
    );
  } else if (activeTab === "attendanceDetail") {
    const currentMonth=learnerCourseAttendanceIstMonth(new Date());
    const requested=first(query.month);
    const selectedMonth=requested&&learnerCourseAttendanceIstWindow(requested)
      ?requested:currentMonth;
    const window=learnerCourseAttendanceIstWindow(selectedMonth)!;
    const attendance = await getLearnerAttendanceWorkspace(
      context,
      { includeHistorical: true,deliveryId,window },
    );
    content = (
      <LearnerCourseAttendance
        key={selectedMonth}
        defaultMonth={selectedMonth}
        currentMonth={currentMonth}
        deliveryId={deliveryId}
        workspace={attendance}
      />
    );
  } else {
    const chatSettings=await readLearnerPlaybackSettings(context.membership?.collegeId)
      .catch(()=>({...LEARNER_PLAYBACK_DEFAULTS}));
    content = <LearnerCourseDiscussion key={learnerDiscussionScopeKey(deliveryId)}
      deliveryId={deliveryId} pollIntervalMs={chatSettings.chatPollIntervalMs} />;
  }

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <PageHeader
        title={workspace.course.name}
        description="Course workspace"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/learn/courses"
              className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text transition hover:border-primary hover:bg-primary-subtle"
            >
              {LEARNER_BACK_TO_COURSES}
            </Link>
            <Link
              href={`/learn/courses/${encodeURIComponent(deliveryId)}/progress`}
              className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle"
            >
              Detailed progress
            </Link>
            <Link
              href={`/learn/courses/${encodeURIComponent(deliveryId)}/attendance-summary`}
              className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle"
            >
              Attendance history
            </Link>
          </div>
        }
      />
      {readOnly?<Banner tone="info">
        Past semester course · Read only. Submitted work remains accessible.
      </Banner>:null}
      <LearnerCourseDocumentTitle courseName={workspace.course.name}
        tabName={learnerCourseTabs.find(tab=>tab.path===activeTab)?.label??"Overview"}/>
       <LearnerCourseTabs deliveryId={deliveryId} activeTab={activeTab}
        persistentQuery={learnerCourseTabPersistentQuery(query)}/>
      {content}
    </div>
  );
}
