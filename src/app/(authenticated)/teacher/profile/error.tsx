"use client";
import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";

export default function FacultyProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert" className="space-y-3 py-6">
      <PageHeader title={"Unable to load your profile"} />
      <p className="mt-2 text-sm text-body">
        Your Faculty profile could not be loaded. Try again.
      </p>
      <Button
        type="button"
        onClick={reset}
        className="mt-5"
      >
        Retry
      </Button>
    </section>
  );
}
