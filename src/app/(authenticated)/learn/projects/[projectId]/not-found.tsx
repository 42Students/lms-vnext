import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
export default function LearnerProjectUnavailable() {
  return (
    <section className="min-w-0 space-y-4 border-b border-border py-5">
      <PageHeader title="Project unavailable" />
      <p className="mx-auto mt-2 max-w-lg text-sm text-body">
        This Project isn&apos;t available to your current learner account.
      </p>
      <Link href="/learn/projects" className="mt-5 inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-primary-foreground">
        Back to my Projects
      </Link>
    </section>
  );
}
