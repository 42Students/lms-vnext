import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { canAccessFacultyRoute } from "@/modules/courses/faculty-route-access-model";
import { ButtonLink } from "@/components/ui/button-link";

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
      <ButtonLink variant="secondary" href="#faculty-page-content"
        className="sr-only focus:left-4 focus:top-[max(1rem,env(safe-area-inset-top))] focus:z-(--lms-z-overlay)">
        Skip to faculty content
      </ButtonLink>
      <div id="faculty-page-content" tabIndex={-1}
        className="min-w-0 scroll-mt-6 focus-ring">
        {children}
      </div>
    </>
  );
}
