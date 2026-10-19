"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main role="alert" className="min-w-0 space-y-5">
    <PageHeader title="This page is temporarily unavailable" />
    <p className="text-sm text-body">Something went wrong on our side. Please try again in a moment.</p>
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" onClick={reset}>Try again</Button>
      <Link href="/recruiter" className="inline-flex min-h-9 items-center rounded-[9px] border border-border bg-surface px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Go to home
      </Link>
    </div>
  </main>;
}
