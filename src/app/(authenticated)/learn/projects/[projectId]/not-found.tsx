import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
export default function LearnerProjectUnavailable() {
  return (
    <section className="min-w-0 space-y-4 border-b border-border py-6">
      <PageHeader title="Project unavailable" />
      <p className="mt-2 max-w-lg break-words text-sm text-body">
        This Project isn&apos;t available to your current learner account.
      </p>
      <ButtonLink variant="primary" href="/learn/projects" className="mt-4 w-full sm:w-auto">
        Back to my Projects
      </ButtonLink>
    </section>
  );
}
