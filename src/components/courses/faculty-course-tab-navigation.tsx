"use client";

import Link from "next/link";
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link href="/teacher/courses" className="text-sm font-semibold text-primary-text hover:underline">
            ← My Teaching Courses
          </Link>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {courseName} · {sectionName}
          </p>
        </div>
        {teachingSections.length > 1 ? (
          <label htmlFor="faculty-course-section" className="text-xs font-semibold text-body">
            Teaching Section
            <select
              id="faculty-course-section"
              value={deliveryId}
              onChange={(event) => router.push(facultyCourseTabHref(event.target.value, activeTab))}
              className="ml-2 min-h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
            >
              {teachingSections.map((section) => (
                <option key={section.deliveryId} value={section.deliveryId}>{section.label}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <nav aria-label="Faculty course tabs" className="flex flex-wrap gap-1 border-b border-border">
        {facultyCourseTabs.map((tab) => {
          const active = tab.path === activeTab;
          return (
            <Link
              key={tab.path}
              href={facultyCourseTabHref(deliveryId, tab.path)}
              aria-current={active ? "page" : undefined}
              className={
                "inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary " +
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
