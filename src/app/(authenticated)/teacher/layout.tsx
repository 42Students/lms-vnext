import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { canAccessRolePortal } from "@/modules/identity/role-portal-policy";
import { ButtonLink } from "@/components/ui/button-link";

export default async function TeacherLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const context = await getCurrentRequestContext();
  // Session absence/expiry is handled by the authenticated parent layout:
  // only signed-in members without a faculty grant reach this branch.
  if (!canAccessRolePortal(context, "teacher")) {
    redirect("/dashboard");
  }
  // UX-teacher-shared-01: every faculty route, including reports and deep links,
  // has the same keyboard-accessible skip target without nesting <main> landmarks.
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
