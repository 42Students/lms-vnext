"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function MentorProjectError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Project could not be loaded" description="Your project work has not been changed."
    action={<><Button variant="secondary" onClick={reset}>Retry</Button>
      <Link href="/mentor/projects" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-9">Projects</Link></>} />;
}
