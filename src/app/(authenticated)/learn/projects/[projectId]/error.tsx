"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
export default function LearnerProjectDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="min-w-0 space-y-4">
      <PageHeader title={"We couldn't load this project"} />
      <p className="mt-2 max-w-2xl text-sm leading-6 text-body">
        Please check your connection, then try again. Your project activity has not been changed.
      </p>
      <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
        <ButtonLink variant="secondary" href="/learn/projects" className="w-full sm:w-auto">Back to Projects</ButtonLink>
      </div>
    </section>
  );
}
