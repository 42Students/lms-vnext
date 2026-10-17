"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function MentorProjectError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Project could not be loaded" description="Your project work has not been changed."
    action={<><Button variant="secondary" onClick={reset}>Retry</Button>
      <Link href="/mentor/projects" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-[var(--lms-teal-deep)]">Projects</Link></>} />;
}
