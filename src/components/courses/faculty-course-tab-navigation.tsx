"use client";

import { Select } from "@/components/ui/select";
import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { facultyCourseTabs, facultyCourseTabFromPath, facultyCourseTabHref } from "@/modules/courses/faculty-course-navigation";

type FacultyTeachingSection = {
  deliveryId: string;
  label: string;
};

export function FacultyCourseTabNavigation({
  deliveryId,
  courseName,
  sectionName,
  teachingSections,
}: {
  deliveryId: string;
  courseName: string;
  sectionName: string;
  teachingSections: readonly FacultyTeachingSection[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = facultyCourseTabFromPath(pathname);
  useEffect(() => {
    // Revalidate current persisted Faculty assignment on tab return.
    const onReturn = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onReturn);
    const interval = window.setInterval(onReturn, 60000);
    return () => {
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
      window.clearInterval(interval);
    };
  }, [router]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link href="/teacher/courses" className="text-sm font-semibold text-primary-text hover:underline">
            Back to courses
          </Link>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {courseName} · {sectionName}
          </p>
        </div>
        {teachingSections.length > 1 ? (
          <label htmlFor="faculty-course-section" className="text-xs font-semibold text-body">
            {activeTab==="attendanceDetail"?"Select class to view attendance":"Teaching Section"}
            <Select
              id="faculty-course-section"
              value={deliveryId}
              onChange={(event) => router.push(facultyCourseTabHref(event.target.value, activeTab))}
              className="ml-2 min-h-11 sm:min-h-9"
            >
              {teachingSections.map((section) => (
                <option key={section.deliveryId} value={section.deliveryId}>{section.label}</option>
              ))}
            </Select>
          </label>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/assignments/manage"}
          className="inline-flex min-h-10 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-semibold text-primary-text">
          Author Assignments
        </Link>
        <Link href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/quizzes/manage"}
          className="inline-flex min-h-10 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-semibold text-primary-text">
          Build Quizzes
        </Link>
        <Link href={"/teacher/live-classes?deliveryId="+encodeURIComponent(deliveryId)}
          className="inline-flex min-h-10 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-semibold text-primary-text">
          Live Classes
        </Link>
      </div>
      <nav aria-label="Faculty course tabs" className="flex max-w-full gap-1 overflow-x-auto border-b border-border pb-1" tabIndex={0}>
        {facultyCourseTabs.map((tab) => {
          const active = tab.path === activeTab;
          return (
            <Link
              key={tab.path}
              href={facultyCourseTabHref(deliveryId, tab.path)}
              aria-current={active ? "page" : undefined}
              className={
                "inline-flex min-h-11 shrink-0 whitespace-nowrap items-center border-b-2 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary " +
                (active
                  ? "border-primary text-primary-text"
                  : "border-transparent text-body hover:border-border-strong hover:text-primary-text")
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
