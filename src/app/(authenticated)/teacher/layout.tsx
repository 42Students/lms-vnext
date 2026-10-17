import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { canAccessFacultyRoute } from "@/modules/courses/faculty-route-access-model";

export default async function TeacherLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const context = await getCurrentRequestContext();
  if (!canAccessFacultyRoute(context)) {
    redirect("/dashboard");
  }
  // UX-teacher-shared-01: every faculty route, including reports and deep links,
  // has the same keyboard-accessible skip target without nesting <main> landmarks.
  return (
    <>
      <a href="#faculty-page-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-md focus:border focus:border-primary focus:bg-surface focus:px-4 focus:text-sm focus:font-semibold focus:text-primary-text focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-[var(--lms-focus-ring)]">
        Skip to faculty content
      </a>
      <div id="faculty-page-content" tabIndex={-1}
        className="min-w-0 scroll-mt-6 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]">
        {children}
      </div>
    </>
  );
}
