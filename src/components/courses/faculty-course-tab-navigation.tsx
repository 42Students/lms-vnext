"use client";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { PageBackLink } from "@/components/ui/page-back-link";
import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { facultyCourseTabs, facultyCourseTabFromPath, facultyCourseTabHref } from "@/modules/courses/faculty-course-navigation";

type FacultyTeachingSection = {
  deliveryId: string;
  label: string;
  /** Populated only from an active, authorized Section join on the server. */
  legacyClassId?: number | null;
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
    // A historical numeric cls is never an unconstrained Section lookup. It
    // must match a teaching grant already authorized by the server.
    const cls = new URLSearchParams(window.location.search).get("cls");
    if(cls){
      const target = teachingSections.find(section =>
        section.deliveryId === cls ||
        (section.legacyClassId !== null &&
         section.legacyClassId !== undefined &&
         /^\\d{1,10}$/.test(cls) &&
         String(section.legacyClassId) === cls));
      if(!target){
        router.replace("/teacher/courses");
        return;
      }
      const canonical = facultyCourseTabHref(target.deliveryId, activeTab);
      router.replace(canonical);
    }
  }, [activeTab,router,teachingSections]);
  useEffect(() => {
    // Revalidate current persisted Faculty assignment on tab return.
    const onReturn = () => {
      if (document.visibilityState !== "visible") return;
      // Never keep a possibly revoked roster mounted while disconnected.
      if (!navigator.onLine) { router.replace("/teacher/courses"); return; }
      router.refresh();
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
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <PageBackLink href="/teacher/courses" label="Back to courses" />
          <p className="sr-only">{courseName} · {sectionName}</p>
        </div>
        {teachingSections.length > 1 ? (
          <label htmlFor="faculty-course-section" className="grid w-full min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:max-w-[18rem]">
            {activeTab==="attendanceDetail"?"Select class to view attendance":"Teaching Section"}
            <Select
              id="faculty-course-section"
              value={deliveryId}
              onChange={(event) => router.push(facultyCourseTabHref(event.target.value, activeTab))}
              className="min-h-11 w-full min-w-0 md:min-h-9"
            >
              {teachingSections.map((section) => (
                <option key={section.deliveryId} value={section.deliveryId}>{section.label}</option>
              ))}
            </Select>
          </label>
        ) : null}
      </div>
      <nav aria-label="Course tools" className="grid min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-3 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
        <Link href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/assignments/manage"}
          className="inline-flex min-h-11 min-w-0 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] px-[var(--lms-space-3)] py-2 text-center text-[13px] font-semibold leading-5 text-[var(--lms-primary-text)] transition-colors duration-[var(--lms-motion-fast)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] sm:w-auto md:min-h-9">
          Author Assignments
        </Link>
        <Link href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/quizzes/manage"}
          className="inline-flex min-h-11 min-w-0 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] px-[var(--lms-space-3)] py-2 text-center text-[13px] font-semibold leading-5 text-[var(--lms-primary-text)] transition-colors duration-[var(--lms-motion-fast)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] sm:w-auto md:min-h-9">
          Build Quizzes
        </Link>
        <Link href={"/teacher/live-classes?deliveryId="+encodeURIComponent(deliveryId)}
          className="inline-flex min-h-11 min-w-0 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-[var(--lms-surface)] px-[var(--lms-space-3)] py-2 text-center text-[13px] font-semibold leading-5 text-[var(--lms-primary-text)] transition-colors duration-[var(--lms-motion-fast)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] sm:w-auto md:min-h-9">
          Live Classes
        </Link>
      </nav>
      <Tabs ariaLabel="Faculty course tabs" value={activeTab} renderPanel={false}
        items={facultyCourseTabs.map(tab => ({
          value: tab.path,
          label: tab.label,
          href: facultyCourseTabHref(deliveryId, tab.path),
        }))} />
    </div>
  );
}
