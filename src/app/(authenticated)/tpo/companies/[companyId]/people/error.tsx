"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div role="alert" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-6">
    <h1 className="font-semibold">Contact people could not be loaded</h1>
    <p className="mt-2 text-sm text-body">The contact list is unavailable; this is not an empty list.</p>
    <Button variant="secondary" className="mt-4" onClick={reset}>Retry</Button>
  </div>;
}
