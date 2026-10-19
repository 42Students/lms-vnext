"use client";

import Link from "next/link";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function CollegeContactsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Contact directory unavailable" description="No contact records could be loaded. Retry safely or reset filters."
    action={<><Button variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>
      <Link href="/college/contacts" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Clear filters</Link></>} />;
}
