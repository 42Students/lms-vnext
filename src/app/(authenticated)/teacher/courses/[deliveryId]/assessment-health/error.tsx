"use client";
import {PageHeader} from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";
import {ButtonLink} from "@/components/ui/button-link";

export default function Error({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section className="min-w-0 space-y-4">
    <PageHeader title={"Section assessment health is unavailable"} />
    <p role="alert" className="mt-2 text-sm text-body">
      The report could not be loaded. This is not a zero-response result; retry or return to your courses.
    </p>
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <Button type="button" onClick={reset} className="min-h-11 w-full sm:w-auto md:min-h-9">Retry report</Button>
      <ButtonLink variant="secondary" href="/teacher/courses" className="w-full sm:w-auto">Back to courses</ButtonLink>
    </div>
  </section>;
}
