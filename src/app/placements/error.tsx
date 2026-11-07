"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

/** A failed read is retryable; do not suggest that the college unpublished its page. */
export default function PublicPlacementsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh bg-[color:var(--lms-neutral-50)] px-4 py-8">
      <main className="mx-auto w-full max-w-[760px] min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 sm:p-6">
        <section role="alert" className="space-y-4">
          <PageHeader title="We couldn't load this page" />
          <p className="text-sm leading-6 text-body">
            Public placements information is temporarily unavailable. Your college may still have a published page.
          </p>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" className="min-h-11 w-full sm:w-auto" onClick={reset}>Try again</Button>
            <ButtonLink variant="secondary" className="min-h-11 w-full sm:w-auto" href="/">Go to college home</ButtonLink>
          </div>
        </section>
      </main>
    </div>
  );
}
