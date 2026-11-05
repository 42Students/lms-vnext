"use client";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { facultyCourseTabs, facultyCourseTabFromPath, facultyCourseTabHref } from "@/modules/courses/faculty-course-navigation";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
import { ButtonLink } from "@/components/ui/button-link";

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
         /^\d{1,10}$/.test(cls) &&
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
      // Offline does not mean the assignment has been revoked. Do not
      // destroy the currently selected Section or discard course context.
      if (!navigator.onLine) return;
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
      <p className="sr-only">{courseName} · {sectionName}</p>
      <div className="flex min-w-0 items-center justify-between gap-3">
        {/* The prototype places the sole back link in the shared course header. */}
        {teachingSections.length > 1 ? (
          <Label stack htmlFor="faculty-course-section" className="w-full min-w-0 sm:w-40">
            Class
            <Select
              id="faculty-course-section"
              aria-label={"Select class for "+facultyCourseTabs.find(tab=>tab.path===activeTab)?.label}
              value={deliveryId}
              onChange={(event) => router.push(facultyCourseTabHref(event.target.value, activeTab))}
              className="min-h-11 w-full min-w-0 md:min-h-9"
            >
              <option value="" disabled>Select Class</option>
              {teachingSections.map((section) => (
                <option key={section.deliveryId} value={section.deliveryId}>{section.label}</option>
              ))}
            </Select>
          </Label>
        ) : null}
      </div>
      <Disclosure title="Course tools" className="min-w-0">
      <nav aria-label="Course tools" className="mt-2 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
        <ButtonLink variant="secondary" href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/assignments/manage"}
          className="min-w-0 w-full sm:w-auto">
          Author Assignments
        </ButtonLink>
        <ButtonLink variant="secondary" href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/quizzes/manage"}
          className="min-w-0 w-full sm:w-auto">
          Build Quizzes
        </ButtonLink>
        <ButtonLink variant="secondary" href={"/teacher/live-classes?deliveryId="+encodeURIComponent(deliveryId)}
          className="min-w-0 w-full sm:w-auto">
          Live Classes
        </ButtonLink>
      </nav>
      </Disclosure>
      <Tabs className="faculty-prototype-course-tabs" ariaLabel="Faculty course tabs" value={activeTab} renderPanel={false}
        items={facultyCourseTabs.map(tab => ({
          value: tab.path,
          label: tab.label,
          href: facultyCourseTabHref(deliveryId, tab.path),
        }))} />
    </div>
  );
}
