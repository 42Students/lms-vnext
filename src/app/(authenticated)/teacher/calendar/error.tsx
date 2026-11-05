"use client";

import { PageHeader } from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export default function FacultyClassScheduleError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title="Class Schedule" />
      <Alert tone="error" title="Failed to load course data">
        Calendar events may be incomplete. Retry the schedule or return to Courses without changing any saved classes.
      </Alert>
      <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <Button onClick={reset}>Retry class schedule</Button>
        <ButtonLink variant="secondary" href="/teacher/courses">
          Back to courses
        </ButtonLink>
      </div>
    </section>
  );
}
