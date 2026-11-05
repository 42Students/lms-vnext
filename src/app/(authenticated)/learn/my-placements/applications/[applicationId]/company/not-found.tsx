import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { learnerCompanyPreviewNonApplicantMessage } from "@/modules/placements/learner-application-detail-service";
import { ButtonLink } from "@/components/ui/button-link";

export default function LearnerApplicationCompanyNotFound() {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title="Company details unavailable" description={learnerCompanyPreviewNonApplicantMessage} />
      <Alert tone="warning">Only your own application can open this preview. No other learner or employer data is disclosed.</Alert>
      <ButtonLink variant="secondary" href="/learn/my-placements/applications" className="w-full sm:w-auto">Back to applications</ButtonLink>
    </section>
  );
}
