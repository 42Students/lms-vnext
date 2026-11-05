import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";

export default function LearnerApplicationHistoryNotFound() {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title="Application history unavailable" />
      <Alert tone="warning">This application or its status history is not available to your account.</Alert>
      <ButtonLink variant="secondary" href="/learn/my-placements/applications" className="w-full sm:w-auto">Back to applications</ButtonLink>
    </section>
  );
}
