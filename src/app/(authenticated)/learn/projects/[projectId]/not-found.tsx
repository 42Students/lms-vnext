import Link from "next/link";
export default function LearnerProjectUnavailable() {
  return (
    <section className="rounded-xl border border-border bg-surface px-5 py-10 text-center">
      <h1 className="font-semibold text-[var(--lms-heading)] text-[30px] leading-9">Project unavailable</h1>
      <p className="mx-auto mt-2 max-w-lg text-sm text-body">
        This Project isn&apos;t available to your current learner account.
      </p>
      <Link href="/learn/projects" className="mt-5 inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-primary-foreground">
        Back to my Projects
      </Link>
    </section>
  );
}
