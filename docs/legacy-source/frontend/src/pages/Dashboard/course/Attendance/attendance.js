import React from "react";
import AttendanceReport from "./AttendanceReport";

const Attendance = () => {
  // Same page-head + single content-card structure as ProjectDetailContent's tabs (see
  // CourseTabsLayout) — the old scroll-container > ln-module-card wrapper double-boxed inside
  // the layout's own learn-projects__shell card.
  return (
    <div className="learn-projects-detail learn-course-attendance">
      <div className="learn-projects-detail__body">
        <section className="learn-projects-detail__content">
          <AttendanceReport />
        </section>
      </div>
    </div>
  );
};

export default Attendance;
