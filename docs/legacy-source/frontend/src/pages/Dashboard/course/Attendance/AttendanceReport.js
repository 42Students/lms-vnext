import React, { useState } from "react";
import { useRouter as useClassRouter } from "next/router";
import { canonicalClassHref } from "@/utils/facultyCourseDetail";
import { useDispatch, useSelector } from "react-redux";
import { Select, Segmented } from "antd";
import TakeAttendanceHeaderFilters from "@/components/Attendance/TakeAttendanceHeaderFilters/TakeAttendanceHeaderFilters";
import CourseAttendeeHeaderFilters from "@/components/Attendance/CourseAttendeeHeaderFilters/CourseAttendeeHeaderFilters";
import StudentAttendanceView from "./StudentAttendanceView";
import TeacherAttendanceView from "./TeacherAttendanceView";
import { courseAction, loginUserAction } from "@/redux/store";

const AttendanceReport = () => {
  const dispatch = useDispatch();
  const loginUser = useSelector(state => state.loginUser);
  const userType = loginUser?.userType;
  const isTeacherRole = userType === "FACULTY";
  const isAdmin = userType === "ADMIN" || userType === "SUPER_ADMIN";
  const canManageAttendance = isTeacherRole || isAdmin;
  const courseClassAssignments = useSelector(state => state.course.courseClassAssignments) ?? [];
  const takeAttendanceDirty = useSelector(state => Boolean(state.course.takeAttendanceDirty));
  const [isTakeAttendance, setTakeAttendance] = useState(false);

  const confirmDiscardAttendanceDraft = () => {
    if (!takeAttendanceDirty) return true;
    if (!window.confirm("Discard your unsaved attendance changes?")) return false;
    dispatch(courseAction.handleCourseData({ key: "takeAttendanceDirty", value: false }));
    return true;
  };

  const classRouter = useClassRouter();
  const handleClassSwitch = (value) => {
    if (!confirmDiscardAttendanceDraft()) return;
    const selected = courseClassAssignments.find(c => c.classId === value);
    if (selected) {
      dispatch(loginUserAction.handleUserData({
        classId: selected.classId,
        className: selected.className,
      }));
      // BE-0024: the address names the section too (the course page reads ?cls= first), so the choice sticks.
      if (classRouter?.asPath) classRouter.replace(canonicalClassHref(classRouter.asPath, selected.classId), undefined, { shallow: true });
    }
  };

  return (
    <div className="attendance-list learn-attendance-inner">
      {/* Sr-only heading + visible subtitle, matching every other course tab and Projects' own
          tabs (see CourseTabsLayout) — the pill above already says "Attendance". */}
      <div className="learn-projects-detail__page-head">
        <div>
          <h3 className="learn-projects-detail__page-head-title--sr-only">Attendance</h3>
          <p className="learn-projects-detail__page-head-subtitle">
            {canManageAttendance
              ? "See attendance history and monthly trends in one place."
              : "See your attendance record and class-wise status in one place."}
          </p>
        </div>
      </div>
      <div className="attendee-header-wrapper learn-course-attendance__toolbar">
        <div className="attendee-header-row learn-course-attendance__toolbar-left">
          {canManageAttendance && courseClassAssignments.length > 1 && (
            <Select
              value={loginUser?.classId}
              onChange={handleClassSwitch}
              options={courseClassAssignments.map(c => ({
                value: c.classId,
                label: c.className,
              }))}
              className="learn-course-attendance__class-select"
              style={{ width: "min(160px, 100%)" }}
              placeholder="Select Class"
              aria-label="Select class to view attendance"
            />
          )}

          {canManageAttendance && (
            <Segmented
              value={isTakeAttendance ? "take" : "report"}
              onChange={value => { if (value === "take" || confirmDiscardAttendanceDraft()) setTakeAttendance(value === "take"); }}
              options={[
                { label: "Attendance report", value: "report" },
                { label: "Mark attendance", value: "take" },
              ]}
              className="learn-course-attendance__mode"
            />
          )}
        </div>

        {isTakeAttendance ? (
          <TakeAttendanceHeaderFilters />
        ) : (
          <CourseAttendeeHeaderFilters />
        )}
      </div>
      {canManageAttendance ? (
        <TeacherAttendanceView isTakeAttendance={isTakeAttendance} />
      ) : (
        <StudentAttendanceView />
      )}
    </div>
  );
};

export default AttendanceReport;
