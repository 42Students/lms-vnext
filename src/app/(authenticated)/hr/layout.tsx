import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasActiveRecruiter } from "@/modules/identity/context";

export default async function HrLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context =
    await getCurrentRequestContext();

  if (!hasActiveRecruiter(context)) {
    redirect("/dashboard");
  }

  // The authenticated shell already owns the only page canvas and landmark.
  // HR's deep routes still need a keyboard skip target and an overflow-safe rail.
  return (
    <>
      <a
        href="#hr-page-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-[max(1rem,env(safe-area-inset-top))] focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-[var(--lms-control-radius)] focus:border focus:border-primary focus:bg-surface focus:px-4 focus:text-sm focus:font-semibold focus:text-primary-text focus:outline-2 focus:outline-offset-[3px] focus:outline-[var(--lms-primary-text)]"
      >
        Skip to HR content
      </a>
      <div
        id="hr-page-content"
        tabIndex={-1}
        className="min-w-0 scroll-mt-6 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
      >
        {children}
      </div>
    </>
  );
}
