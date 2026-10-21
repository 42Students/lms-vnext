import CourseTabsLayout from "@/layouts/CourseTabsLayout";
import CourseTabSkeleton from "@/components/Course/Common/CourseTabSkeleton";
import React, { useEffect, useState } from "react";
import { Alert, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import Syllabus from "../../../Dashboard/course/syllabus/syllabus";
import Student from "../../../Dashboard/course/Sudent/student";
import Attendance from "../../../Dashboard/course/Attendance/attendance";
import Home from "../../../Dashboard/course/Home/Home";
import Classroom from "../../../Dashboard/course/Classroom/classroom";
import { useRouter } from "next/router";
import { courseAction, loginUserAction } from "@/redux/store";
import {
  resolveNumericFacultyCourse, resolveFacultyCourseClass,
  canonicalCourseHref, canonicalClassHref,
} from "@/utils/facultyCourseDetail";

const VALID_TABS = ["home", "blueprint", "students", "attendanceDetail", "discussions"];

function CourseTab() {
  const router = useRouter();
  const { courseTab, courseId } = router.query;
  const loginUser = useSelector((state) => state.loginUser);
  const isTeacherRole = loginUser?.userType === "FACULTY" && !!loginUser?.isUserLoggedIn;
  const dispatch = useDispatch();
  const [bootstrapError, setBootstrapError] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const tab = Array.isArray(courseTab) ? courseTab[0] : courseTab;

  useEffect(() => {
    const clearCourseContext = () => {
      dispatch(courseAction.setCurrentLessonIndex(null));
      dispatch(courseAction.handleCourseData({ key: "selectedCourseId", value: null }));
      dispatch(courseAction.handleCourseData({ key: "selectedCourseSlug", value: null }));
      dispatch(courseAction.handleCourseData({ key: "courseClassAssignments", value: [] }));
      dispatch(loginUserAction.handleUserData({ selectedCourse: null, CourseID: null }));
    };
    if (!router.isReady) {
      setBootstrapLoading(true);
      return undefined;
    }
    if (!isTeacherRole || typeof courseId !== "string" || !courseId.trim()) {
      clearCourseContext();
      setBootstrapError(true);
      setBootstrapLoading(false);
      return undefined;
    }

    let cancelled = false;
    const failBootstrap = () => {
      if (!cancelled) {
        clearCourseContext();
        setBootstrapError(true);
        setBootstrapLoading(false);
      }
    };

    const resolveClassContext = async (course, preferredClassId = null) => {
      if (!course?.id || cancelled) throw new Error("Course context missing");
      const { getActiveAssignmentsByFaculty } = await import("@/api/Services/FacultyAssignmentService");
      const assignmentResponse = await getActiveAssignmentsByFaculty(loginUser.id);
      if (cancelled) return;
      const assignments = assignmentResponse?.data?.data;
      if (!Array.isArray(assignments)) throw new Error("Faculty assignments unavailable");
      const requestedClassId = Array.isArray(router.query.cls)
        ? router.query.cls[0] : router.query.cls;
      const { options, selected } = resolveFacultyCourseClass({
        assignments, course, facultyId: loginUser.id, requestedClassId,
        existingClassId: loginUser.classId, preferredClassId,
      });
      if (cancelled) return;
      dispatch(courseAction.handleCourseData({ key: "courseClassAssignments", value: options }));
      dispatch(loginUserAction.handleUserData({
        classId: selected?.classId ?? null, className: selected?.className ?? null,
      }));
      if (requestedClassId != null &&
          (!selected || Number(requestedClassId) !== selected.classId)) {
        const nextPath = canonicalClassHref(router.asPath, selected?.classId ?? null);
        if (nextPath !== router.asPath) router.replace(nextPath, undefined, { shallow: true });
      }
    };

    const bootCourse = async () => {
      setBootstrapLoading(true);
      setBootstrapError(false);
      clearCourseContext();
      const numericId = /^\d+$/.test(courseId);
      let course;
      let preferredClassId = null;
      if (numericId) {
        const { getCourseByMappingId, getCourse } = await import("@/api/Services/courseServices");
        const reference = Array.isArray(router.query.ref) ? router.query.ref[0] : router.query.ref;
        const result = await resolveNumericFacultyCourse({
          identifier: courseId, facultyId: loginUser.id, preferCourseId: reference === "course",
          getMapping: getCourseByMappingId, getCourse,
        });
        if (cancelled) return;
        course = result.course;
        preferredClassId = result.classId;
        if (course?.slug) {
          const redirect = canonicalCourseHref(router.asPath, courseId, course.slug);
          if (redirect && redirect !== router.asPath) {
            await router.replace(redirect, undefined, { shallow: false });
            return;
          }
        }
      } else {
        const { getCourseBySlug } = await import("@/api/Services/courseServices");
        const response = await getCourseBySlug(courseId);
        if (cancelled) return;
        course = response?.data?.data;
      }
      if (!course || course.id == null) throw new Error("Course not found");
      if (cancelled) return;
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
      await resolveClassContext(course, preferredClassId);
    };

    bootCourse().catch(failBootstrap).finally(() => {
      if (!cancelled) setBootstrapLoading(false);
    });
    return () => { cancelled = true; };
  }, [courseId, isTeacherRole, dispatch, loginUser?.id, loginUser?.collegeId,
    loginUser?.organizationId, router.isReady, router.query.cls, router.query.ref, retryKey]);

  // A single initial assignment fetch is insufficient: an administrator can deactivate or
  // remap this Faculty's class while the browser stays on the same course tab. Revalidate on
  // tab return/window focus and at a bounded cadence while visible; backend remains the
  // authorization boundary for privileged operations between checks.
  const selectedCourseId = loginUser?.selectedCourse?.id;
  useEffect(() => {
    if (!router.isReady || !isTeacherRole || bootstrapLoading || bootstrapError ||
        selectedCourseId == null || typeof courseId !== "string") return undefined;
    const controller = new AbortController();
    let stopped = false;
    let sequence = 0;
    const refresh = async () => {
      if (stopped || (typeof document !== "undefined" && document.visibilityState === "hidden")) return;
      const current = ++sequence;
      try {
        const { getActiveAssignmentsByFaculty } = await import("@/api/Services/FacultyAssignmentService");
        if (stopped || current !== sequence) return;
        const response = await getActiveAssignmentsByFaculty(loginUser.id, { signal: controller.signal });
        if (stopped || current !== sequence || controller.signal.aborted) return;
        const assignments = response?.data?.data;
        if (!Array.isArray(assignments)) throw new Error("Faculty assignment response invalid");
        const requestedClassId = Array.isArray(router.query.cls)
          ? router.query.cls[0] : router.query.cls;
        const { options, selected } = resolveFacultyCourseClass({
          assignments, course: { id: selectedCourseId }, facultyId: loginUser.id,
          requestedClassId, existingClassId: loginUser.classId, preferredClassId: null,
        });
        if (!options.length || !selected) {
          dispatch(courseAction.setCurrentLessonIndex(null));
          dispatch(courseAction.handleCourseData({ key: "selectedCourseId", value: null }));
          dispatch(courseAction.handleCourseData({ key: "selectedCourseSlug", value: null }));
          dispatch(courseAction.handleCourseData({ key: "courseClassAssignments", value: [] }));
          dispatch(loginUserAction.handleUserData({ selectedCourse: null, CourseID: null,
            classId: null, className: null }));
          setBootstrapError(true);
          return;
        }
        dispatch(courseAction.handleCourseData({ key: "courseClassAssignments", value: options }));
        if (Number(loginUser.classId) !== selected.classId) {
          dispatch(loginUserAction.handleUserData({
            classId: selected.classId, className: selected.className,
          }));
        }
        if (requestedClassId != null && Number(requestedClassId) !== selected.classId) {
          const nextPath = canonicalClassHref(router.asPath, selected.classId);
          if (nextPath !== router.asPath) router.replace(nextPath, undefined, { shallow: true });
        }
      } catch (error) {
        if (stopped || current !== sequence || controller.signal.aborted ||
            error?.code === "ERR_CANCELED") return;
        // Never present a cached roster as verified after an authorization/refresh failure.
        dispatch(courseAction.handleCourseData({ key: "courseClassAssignments", value: [] }));
        dispatch(loginUserAction.handleUserData({ selectedCourse: null, CourseID: null }));
        setBootstrapError(true);
      }
    };
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    const timer = window.setInterval(refresh, 60000);
    return () => {
      stopped = true;
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router.isReady, isTeacherRole, bootstrapLoading, bootstrapError, selectedCourseId,
    courseId, loginUser?.id, loginUser?.collegeId, loginUser?.organizationId,
    loginUser?.classId, router.query.cls, dispatch]);

  useEffect(() => {
    if (!router.isReady || typeof courseId !== "string") return;
    if (tab && !VALID_TABS.includes(tab)) {
      const query = router.asPath.includes("?")
        ? `?${router.asPath.split("?").slice(1).join("?")}` : "";
      router.replace(`/teacher/courses/${encodeURIComponent(courseId)}/home${query}`, undefined, { shallow: false });
    }
  }, [courseId, router.isReady, tab]);

  if (!isTeacherRole || bootstrapError) return (
    <div className="learn-course-canvas"><div className="scroll-container learn-course-home">
      <div className="ln-module-card mb-3" style={{ textAlign: "center", padding: "40px 20px" }}>
        <Alert type="error" message={!isTeacherRole ? "Faculty access required" : "Could not load teacher course context"}
          description={!isTeacherRole ? "Sign in with a Faculty account to open this course."
            : "Please retry. If this continues, your course assignment may be missing or unavailable."}
          showIcon style={{ marginBottom: 16 }} />
        {isTeacherRole && <Button type="primary" icon={<ReloadOutlined />}
          onClick={() => { setBootstrapError(false); setRetryKey((previous) => previous + 1); }}>
          Try again
        </Button>}
      </div>
    </div></div>
  );
  if (bootstrapLoading) return <CourseTabSkeleton tab={tab} isTeacherRole={isTeacherRole} />;

  function getCourseTab() {
    switch (tab) {
      case "home": return <Home />;
      // BE-0207/BE-0208: another course or section mounts these afresh (no old modal, draft, selection or late answer).
      case "blueprint": return <Syllabus key={`${courseId}:${router.query.cls ?? ""}`} contentMode="blueprint" />;
      case "students": return <Student />;
      case "attendanceDetail": return <Attendance />;
      case "discussions": return <Classroom key={`${courseId}:${router.query.cls ?? ""}`} />;
      default: return <Home />;
    }
  }

  return <div className={`learn-course-canvas learn-course-canvas--${tab || "home"}`}>
    {getCourseTab()}
  </div>;
}

CourseTab.getLayout = CourseTabsLayout;
export default CourseTab;
