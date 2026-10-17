import {
  COLLEGE_NOT_ASSIGNED_DESCRIPTION,
  COLLEGE_NOT_ASSIGNED_TITLE,
  type CollegeCourseTab,
} from "@/modules/courses/college-course-tabs-copy";

/** Legacy Alert for an admin account that has no college (COL-course-tabs-22). */
export function CollegeNotAssignedAlert({ tab }: { tab: CollegeCourseTab }) {
  return (
    <section role="alert" className="rounded-xl border border-border bg-surface p-5">
      <h2 className="m-0 text-base font-semibold text-foreground">{COLLEGE_NOT_ASSIGNED_TITLE}</h2>
      <p className="mt-2 text-sm text-body">{COLLEGE_NOT_ASSIGNED_DESCRIPTION[tab]}</p>
    </section>
  );
}
