import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { learnerCompanyPreviewNonApplicantMessage } from "@/modules/placements/learner-application-detail-service";

export default function LearnerApplicationCompanyNotFound() {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title="Company details unavailable" description={learnerCompanyPreviewNonApplicantMessage} />
      <Alert tone="warning">Only your own application can open this preview. No other learner or employer data is disclosed.</Alert>
      <Link href="/learn/my-placements/applications" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-9">Back to applications</Link>
    </section>
  );
}
