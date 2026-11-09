"use client";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
export default function AdminLessonsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Could not load lessons"
    description="Lesson records for the selected college are temporarily unavailable. An unsuccessful read is not an empty lesson catalogue."
    action={<div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <Button type="button" onClick={reset} className="min-h-11 w-full sm:w-auto">Retry</Button>
      <ButtonLink variant="secondary" href="/admin/courses" className="min-h-11 w-full sm:w-auto">Courses</ButtonLink>
    </div>} />;
}
