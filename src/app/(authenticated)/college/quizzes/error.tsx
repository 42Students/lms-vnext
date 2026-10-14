"use client";
import { Button } from "@/components/ui/button";
export default function CollegeQuizzesError({
  reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  return <section role="alert" className="rounded-xl border border-border bg-surface p-8">
    <h1 className="text-lg font-semibold text-foreground">Quizzes unavailable</h1>
    <p className="mt-2 text-sm text-body">College quizzes could not be loaded. No empty-result conclusion is assumed.</p>
    <Button className="mt-4" onClick={reset}>Retry</Button>
  </section>;
}
