"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

export default function PublicPlacementsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto my-4 min-h-[calc(100vh-2rem)] w-full max-w-4xl rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-4 min-[768px]:p-6">
      <section role="alert" className="space-y-4">
        <PageHeader title="We couldn't load this page" />
        <p className="text-sm text-body">
          Public placements information is temporarily unavailable. Please retry.
        </p>
        <Button type="button" onClick={reset}>Retry</Button>
      </section>
    </main>
  );
}
