import { Banner } from "@/components/ui/banner";
import { CoursesServiceError } from "@/modules/courses/errors";
import { AuthorizationError } from "@/modules/permissions/policy";
import { ZodError } from "zod";
import { LEARNER_BACK_TO_COURSES } from "@/modules/courses/learner-course-copy-model";
import type { ReactNode } from "react";
import Link from "next/link";
import { learnerCourseTabPath } from "@/modules/courses/learner-course-tab-route-model";
import {resolveLegacyLearnerCourseDelivery} from "@/modules/courses/learner-course-legacy-route-service";
import {learnerCourseTabPersistentQuery} from "@/modules/courses/learner-course-tab-context-model";
import {LearnerCourseDocumentTitle} from "@/components/courses/learner-course-document-title";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { LearnerCourseAttendance } from "@/components/courses/learner-course-attendance";
import { LearnerCourseDiscussion } from "@/components/courses/learner-course-discussion";
import { LearnerCourseOverview } from "@/components/courses/learner-course-overview";
import { LearnerCourseTabs, learnerCourseTabs } from "@/components/courses/learner-course-tabs";
import { LearnerCourseWorkspace } from "@/components/courses/learner-course-workspace";
import { LearnerCourseStateRetry } from "@/components/courses/learner-course-state-retry";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
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
  const context = await getCurrentRequestContext();
  const activeTab = learnerCourseTabPath(courseTab, learnerCourseTabs.map((tab) => tab.path));
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deliveryId)){
    const authorizedDeliveryId=await resolveLegacyLearnerCourseDelivery(context,deliveryId);
    if(!authorizedDeliveryId)notFound();
    const safeQuery=new URLSearchParams();
    for(const [key,value] of Object.entries(query)){
      if(!["filter","lesson","content","month","cls","ref",
       "semesterId","academicPeriodId"].includes(key))continue;
      const firstValue=Array.isArray(value)?value[0]:value;
      if(firstValue&&firstValue.length<=100)safeQuery.set(key,firstValue);
    }
    const suffix=safeQuery.toString();
    redirect("/learn/courses/"+encodeURIComponent(authorizedDeliveryId)+"/"+
      (activeTab??"home")+(suffix?"?"+suffix:""));
  }
  if (activeTab === null) {
    // A malformed/foreign delivery must not redirect before checking scope.
    await getLearnerCourseWorkspace(context, deliveryId);
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

  if (courseTab.length > 1) {
    // Legacy catch-all URLs accept a first valid tab and ignore descendants.
    // Canonicalize only after verifying the learner owns this delivery.
    await getLearnerCourseWorkspace(context, deliveryId);
    const safeQuery = new URLSearchParams();
    for (const [key, value] of Object.entries(query).slice(0, 20)) {
      if (key.length > 100) continue;
      const one = Array.isArray(value) ? value[0] : value;
      if (typeof one === "string" && one.length <= 500) safeQuery.set(key, one);
    }
    const suffix = safeQuery.toString();
    redirect("/learn/courses/" + encodeURIComponent(deliveryId) + "/" +
      encodeURIComponent(activeTab) + (suffix ? "?" + suffix : ""));
  }

  const [workspaceResult, deliveriesResult, instructorsResult] = await Promise.allSettled([
    getLearnerCourseWorkspace(context, deliveryId),
    listLearnerCourseDeliveries(context, { includeHistorical: true }),
    activeTab === "home" ? listLearnerCourseInstructors(context, deliveryId) : Promise.resolve([]),
  ]);
  if(workspaceResult.status==="rejected"){
    const reason:unknown=workspaceResult.reason;
    if(reason instanceof AuthorizationError)throw reason;
    if(reason instanceof ZodError ||
      (reason instanceof CoursesServiceError && [
        "SECTION_DELIVERY_NOT_FOUND", "COURSE_NOT_FOUND",
        "LEARNER_PROGRESS_ACCESS_DENIED", "LEARNER_ENROLLMENT_SCOPE_REQUIRED",
      ].includes(reason.code)))notFound();
    // A failed lesson/content read must be retryable, not treated as a
    // missing course or an empty completed lesson list.
  }
  if(deliveriesResult.status==="rejected"){
    const reason:unknown=deliveriesResult.reason;
    if(reason instanceof AuthorizationError)throw reason;
    if(reason instanceof CoursesServiceError || reason instanceof ZodError)notFound();
  }
  if(instructorsResult.status==="rejected"){
    const reason:unknown=instructorsResult.reason;
    if(reason instanceof AuthorizationError)throw reason;
    if(reason instanceof CoursesServiceError || reason instanceof ZodError)notFound();
  }
  if(workspaceResult.status!=="fulfilled" || deliveriesResult.status!=="fulfilled" ||
      instructorsResult.status!=="fulfilled"){
    const lessonReadFailed=activeTab==="roadmap"&&workspaceResult.status==="rejected";
    return <div className="min-w-0 space-y-4">
      <PageHeader title={lessonReadFailed?"Lesson content could not be loaded":"Could not load course"} />
      <Banner tone="warning" role="alert">
        {lessonReadFailed
         ?"Lesson content could not be loaded. Your progress has not been changed; retry to load the latest lessons and completion state."
         :"Could not load course. Content and completion counts may be incomplete."}
        <LearnerCourseStateRetry label="Retry" />
      </Banner>
      <Link href="/learn/courses" className="font-semibold text-primary-text underline">
        {LEARNER_BACK_TO_COURSES}
      </Link>
    </div>;
  }
  const workspace=workspaceResult.value;
  const deliveries=deliveriesResult.value;
  const instructors=instructorsResult.value;

  const courseMeta = deliveries.find(
    (delivery) => delivery.deliveryId === deliveryId,
  );

  if (!courseMeta) {
    // The authorized workspace exists, but no active/historical class-to-course
    // mapping appears in the learner's semester directory. Do not guess a class.
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Not assigned to a class" />
      <Banner tone="warning" role="alert">
        <div className="flex items-start gap-3">
          <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
            strokeLinejoin="round" className="mt-0.5 shrink-0">
            <path d="M12 6c-3-2-6-2.5-9-2v15c3-.5 6 0 9 2m0-15c3-2 6-2.5 9-2v15c-3-.5-6 0-9 2m0-15v15"/>
          </svg>
          <div>
            <p className="font-semibold">Not assigned to a class</p>
            <p className="mt-1">Please contact your administrator to check your course and class assignment.</p>
          </div>
        </div>
      </Banner>
      <Link href="/learn/courses" className="font-semibold text-primary-text underline">
        {LEARNER_BACK_TO_COURSES}
      </Link>
    </div>;
  }

  const readOnly =
    Boolean(courseMeta.deliveryEndedAt) ||
    courseMeta.sectionEnrollmentStatus !== "ACTIVE" ||
    courseMeta.programEnrollmentStatus !== "ACTIVE" ||
    courseMeta.periodStatus === "CLOSED";

  // Legacy links use lowercase roadmap filter names. Preserve known categories
  // without trusting the parameter as a path or database identifier.
  const rawRoadmapFilter = first(query.filter)?.trim().toLowerCase() ?? "all";
  const roadmapFilter = ({
    lectures: "lectures", resources: "resources", assessments: "assessments",
    "live-sessions": "live-sessions", all: "all",
  } as Record<string, string>)[rawRoadmapFilter] ?? "all";
  const courseTitle = workspace.course.name?.trim() || "Unnamed Course";
  let content: ReactNode;

  if (activeTab === "home") {
    const [announcements, displayResult] =
      await Promise.all([
        listLearnerCourseClassAnnouncements(context,courseMeta.sectionId),
        // The optional course home description must not hide the course
        // workspace when its own fetch fails.
        loadCourseDisplayContentIfReady(workspace.course.id)
          .then(value => ({ data: value, failed: false }))
          .catch((error:unknown) => {
            if(error instanceof AuthorizationError)throw error;
            return {data:null,failed:true};
          }),
      ]);
    const display = displayResult.data;
    const courseUpdates = announcements.map(announcement=>({
      id:announcement.id,
      title:announcement.title,
      senderName:announcement.senderName?.trim()||"College staff",
      messageText:announcement.messageText,
      pinned:false,
      createdAt:announcement.createdAt,
    }));

    content = (
      <>
      {displayResult.failed ? <Banner tone="warning" action={
        <Link href={`/learn/courses/${encodeURIComponent(deliveryId)}/home`}
          className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">
          Try again
        </Link>
      }>Failed to load course details.</Banner> : null}
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
      </>
    );
  } else if (activeTab === "roadmap") {
    content = (
      <LearnerCourseWorkspace
        deliveryId={deliveryId}
        workspace={workspace}
        filter={roadmapFilter}
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
      .catch((error:unknown)=>{
        if(error instanceof AuthorizationError)throw error;
        return {...LEARNER_PLAYBACK_DEFAULTS};
      });
    content = <LearnerCourseDiscussion key={learnerDiscussionScopeKey(deliveryId)}
      deliveryId={deliveryId} pollIntervalMs={chatSettings.chatPollIntervalMs} />;
  }

  return (
    <div role="region" aria-label="Course workspace" className={"learn-projects learn-course-layout learn-course-layout--" + activeTab + " min-w-0 max-w-full space-y-4"}>
      <PageHeader title={activeTab === "roadmap" ? "Learning Path" : courseTitle}
        description={activeTab === "roadmap" ? courseTitle : "Course workspace"} />
      <nav aria-label="Course navigation" className="flex flex-wrap items-center gap-3">
        <Link
              href="/learn/courses"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
            >
              {LEARNER_BACK_TO_COURSES}
            </Link>
      </nav>

      {readOnly?<Banner tone="info">
        Past semester course · Read only. Submitted work remains accessible.
      </Banner>:null}
      <LearnerCourseDocumentTitle courseName={courseTitle}
        tabName={learnerCourseTabs.find(tab=>tab.path===activeTab)?.label??"Overview"}/>
       <LearnerCourseTabs deliveryId={deliveryId} activeTab={activeTab}
        persistentQuery={learnerCourseTabPersistentQuery(query)}/>
      <details className="border-b border-border pb-3 text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Course options</summary>
        <nav aria-label="Additional course destinations" className="flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
          <Link
              href={`/learn/courses/${encodeURIComponent(deliveryId)}/progress`}
              className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
            >
              Detailed progress
            </Link>
          <Link
              href={`/learn/courses/${encodeURIComponent(deliveryId)}/attendance-summary`}
              className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
            >
              Attendance history
            </Link>
        </nav>
      </details>
      <div key={deliveryId + ":" + activeTab} className="learn-course-tab-page min-w-0">
        {content}
      </div>
    </div>
  );
}
