"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function AdminLessonsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Could not load lessons" description="Lesson records for the selected college are temporarily unavailable." action={<Button onClick={reset}>Retry</Button>} />;
}
