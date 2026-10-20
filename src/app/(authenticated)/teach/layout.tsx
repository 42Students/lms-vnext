import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { canAccessFacultyRoute } from "@/modules/courses/faculty-route-access-model";

export default async function FacultyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const context = await getCurrentRequestContext();
  if (!canAccessFacultyRoute(context)) {
    redirect("/dashboard");
  }
  // Match the active /teacher faculty surface: no second white canvas or
  // nested main; give keyboard users a direct route-content skip target.
  return (
    <>
      <a href="#faculty-page-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-[max(1rem,env(safe-area-inset-top))] focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-[var(--lms-control-radius)] focus:border focus:border-primary focus:bg-surface focus:px-4 focus:text-sm focus:font-semibold focus:text-primary-text focus:shadow-none focus:outline-2 focus:outline-offset-[3px] focus:outline-[var(--lms-primary-text)]">
        Skip to faculty content
      </a>
      <div id="faculty-page-content" tabIndex={-1}
        className="min-w-0 scroll-mt-6 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        {children}
      </div>
    </>
  );
}
