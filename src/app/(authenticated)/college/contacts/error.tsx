"use client";

import Link from "next/link";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function CollegeContactsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Contact directory unavailable" description="No contact records could be loaded. Retry safely or reset filters."
    action={<><Button variant="secondary" onClick={reset}>Retry</Button>
      <Link href="/college/contacts" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-[var(--lms-teal-deep)]">Clear filters</Link></>} />;
}
