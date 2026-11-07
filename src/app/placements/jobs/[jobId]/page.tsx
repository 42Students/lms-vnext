import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";

export const metadata: Metadata = {
  title: "Shared placement job link · 42Students",
  robots: { index: false, follow: false },
};

/** A retired public job URL never grants access from its identifier alone. */
export default function RetiredPublicPlacementJobPage() {
  return (
    <div className="min-h-dvh bg-[color:var(--lms-neutral-50)] px-4 py-8">
      <main data-testid="placements.retired-job-link"
        className="mx-auto w-full max-w-[760px] min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 sm:p-7">
        <div className="space-y-5">
          <PageHeader title="This shared job link is no longer public" />
          <p className="text-sm leading-6 text-body">
            Placement drive details are available in your college workspace.
            Sign in with your college account to browse drives you can access.
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Historical links do not grant access to a job or an application.
            No student, employer or eligibility details are displayed here.
          </p>
          <nav aria-label="Placement page actions" className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink variant="primary" className="min-h-11 w-full text-center sm:w-auto"
              href="/login?next=%2Flearn%2Fmy-placements%2Fjobs">Sign in to browse college drives</ButtonLink>
            <ButtonLink variant="secondary" className="min-h-11 w-full text-center sm:w-auto"
              href="/placements">Public placement information</ButtonLink>
          </nav>
        </div>
      </main>
    </div>
  );
}
