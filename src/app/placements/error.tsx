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
    <div className="min-h-screen bg-[#f5f7f9] px-4 py-8">
    <main className="mx-auto w-full max-w-[760px] rounded-[8px] border border-[#e5e9f0] bg-white p-6">
      <section role="alert" className="space-y-4">
        <PageHeader title="We couldn't load this page" />
        <p className="text-sm text-body">
          Public placements information is temporarily unavailable. Please retry.
        </p>
        <Button type="button" onClick={reset}>Retry</Button>
      </section>
    </main>
    </div>
  );
}
