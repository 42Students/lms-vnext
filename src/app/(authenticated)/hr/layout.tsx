import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { canAccessRolePortal } from "@/modules/identity/role-portal-policy";
import { ButtonLink } from "@/components/ui/button-link";

export default async function HrLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context =
    await getCurrentRequestContext();

  if (!canAccessRolePortal(context, "hr")) {
    redirect("/dashboard");
  }

  // The authenticated shell already owns the only page canvas and landmark.
  // HR's deep routes still need a keyboard skip target and an overflow-safe rail.
  return (
    <>
      <ButtonLink variant="secondary"
        href="#hr-page-content"
        className="sr-only focus:left-4 focus:top-[max(1rem,env(safe-area-inset-top))] focus:z-(--lms-z-overlay)"
      >
        Skip to HR content
      </ButtonLink>
      <div
        id="hr-page-content"
        tabIndex={-1}
        className="min-w-0 scroll-mt-6 focus-ring"
      >
        {children}
      </div>
    </>
  );
}
