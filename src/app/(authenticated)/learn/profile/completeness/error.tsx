"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function ProfileChecklistError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="min-w-0 space-y-4">
      <PageHeader title="Could not load your profile checklist" />
      <p className="max-w-2xl text-sm leading-6 text-body">
        We cannot infer profile completion while the read failed.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={reset} className="min-h-11 md:min-h-9">
          Retry
        </Button>
        <Link
          href="/learn/profile"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9"
        >
          Profile
        </Link>
      </div>
    </section>
  );
}
