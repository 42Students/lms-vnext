import CourseTabsLayout from "@/layouts/CourseTabsLayout";
import CourseTabSkeleton from "@/components/Course/Common/CourseTabSkeleton";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button } from "antd";
import { ArrowLeftOutlined, ReloadOutlined } from "@ant-design/icons";
import Syllabus from "../../../Dashboard/course/syllabus/syllabus";
import Attendance from "../../../Dashboard/course/Attendance/attendance";
import Home from "../../../Dashboard/course/Home/Home";
import Classroom from "../../../Dashboard/course/Classroom/classroom";
import { useRouter } from "next/router";
import { courseAction, loginUserAction } from "@/redux/store";
import { loadLearnerCourse, learnerCourseCanonicalHref } from "@/utils/learnerCourseDetail";
import { learnerAvailability } from "@/utils/courseUtils/contentAvailability";
import useLearnerClassScope from "@/hooks/useLearnerClassScope";

const VALID_TABS = ["home", "roadmap", "attendanceDetail", "discussions"];

function CourseTab() {
  const router = useRouter();
  const { courseTab, courseId } = router.query;
  const tab = Array.isArray(courseTab) ? courseTab[0] : courseTab;
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState(false);
  const [courseUnavailableReason, setCourseUnavailableReason] = useState("");
  const [loadedContext, setLoadedContext] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const identity = [loginUser?.id ?? "", loginUser?.userType ?? "",
    loginUser?.collegeId ?? "", loginUser?.organizationId ?? "",
    loginUser?.isUserLoggedIn ? "in" : "out"].join(":");
  const context = `${identity}:${typeof courseId === "string" ? courseId : ""}`;

  // A learner's class can be absent from login state: filled in by the shared learner scope hook,
  // the same one All Quizzes and Calendar use (LRN-X-01 / HOME-01). It keys the lookup by learner id,
  // so a previous account's slow request never fills this account's class.
  useLearnerClassScope();

  useEffect(() => {
    if (!router.isReady) return undefined;
    if (!loginUser?.isUserLoggedIn || typeof courseId !== "string" || !courseId.trim()) {
      setLoadedContext(null);
      setCourseError(true);
      setCourseLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    let cancelled = false;
    const run = async () => {
      setCourseLoading(true);
      setCourseError(false);
      setCourseUnavailableReason("");
      setLoadedContext(null);
      // Clear all course-specific state before a new request; never render Course A as Course B.
      dispatch(courseAction.setCurrentLessonIndex(null));
      dispatch(courseAction.handleCourseData({ key: "selectedCourseId", value: null }));
      dispatch(courseAction.handleCourseData({ key: "selectedCourseSlug", value: null }));
      dispatch(loginUserAction.handleUserData({ selectedCourse: null }));
      const { getCourseBySlug, getCourse } = await import("@/api/Services/courseServices");
      if (cancelled) return;
      const { course, numeric } = await loadLearnerCourse(courseId, {
        getCourseBySlug, getCourse, signal: controller.signal,
      });
      if (cancelled) return;
      const availability = learnerAvailability(course);
      if (!availability.visible || !availability.actionable) {
        setCourseUnavailableReason(availability.reason || "This course is not currently available to learners.");
        setCourseError(true);
        return;
      }
      if (numeric && course.slug) {
        const next = learnerCourseCanonicalHref(router.asPath, courseId, course.slug);
        if (next && next !== router.asPath) {
          const navigated = await router.replace(next, undefined, { shallow: false });
          if (!navigated) throw new Error("Unable to redirect to the course");
          return;
        }
      }
      dispatch(courseAction.handleCourseData({ key: "selectedCourseId", value: course.id }));
      dispatch(courseAction.handleCourseData({ key: "selectedCourseSlug", value: course.slug || null }));
      dispatch(loginUserAction.handleUserData({
        CourseID: String(course.slug || course.id),
        selectedCourse: {
          ...course,
          name: course.course_name ?? course.courseName ?? course.name ?? "Unnamed Course",
          slug: course.slug || null,
        },
      }));
      setLoadedContext(context);
    };
    run().catch(() => {
      if (cancelled) return;
      dispatch(loginUserAction.handleUserData({ selectedCourse: null }));
      setLoadedContext(null);
      setCourseError(true);
    }).finally(() => { if (!cancelled) setCourseLoading(false); });
    return () => { cancelled = true; controller.abort(); };
  }, [courseId, identity, loginUser?.isUserLoggedIn, dispatch, router.isReady, retryKey]);

  useEffect(() => {
    if (!router.isReady || typeof courseId !== "string") return;
    if (tab && !VALID_TABS.includes(tab)) {
      const query = router.asPath.includes("?")
        ? `?${router.asPath.split("?").slice(1).join("?")}` : "";
      router.replace(`/learn/courses/${encodeURIComponent(courseId)}/home${query}`, undefined, { shallow: false });
    }
  }, [courseId, router.isReady, tab]);

  function getCourseTab() {
    switch (tab) {
      case "home": return <Home />;
      // BE-0207/BE-0208: another course mounts the Learning Path and Discussion afresh (no old modal, draft or late answer).
      case "roadmap": return <Syllabus key={String(courseId)} contentMode="roadmap" />;
      case "discussions": return <Classroom key={String(courseId)} />;
      case "attendanceDetail": return <Attendance />;
      default: return <Home />;
    }
  }

  if (courseError && !courseLoading) return (
    <div className="learn-course-canvas"><div className="scroll-container learn-course-home">
      <div className="ln-module-card mb-3" style={{ textAlign: "center", padding: "40px 20px" }}>
        <Alert type="error" message={courseUnavailableReason ? "Course unavailable" : "Could not load course"}
          description={courseUnavailableReason || "This course may not exist or you may not have access. Please try again or return to your courses."}
          showIcon style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Button type="primary" icon={<ReloadOutlined />}
            onClick={() => { setCourseError(false); setCourseUnavailableReason(""); setRetryKey((key) => key + 1); }}>Try again</Button>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/learn/courses")}>
            Back to Courses</Button>
        </div>
      </div>
    </div></div>
  );
  if (courseLoading || loadedContext !== context) return <CourseTabSkeleton tab={tab} />;
  return <div className={`learn-course-canvas learn-course-canvas--${tab || "home"}`}>
    {getCourseTab()}
  </div>;
}

CourseTab.getLayout = CourseTabsLayout;
export default CourseTab;
