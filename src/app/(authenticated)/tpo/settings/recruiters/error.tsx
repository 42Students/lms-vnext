"use client";
import { PageHeader } from "@/components/ui/page-header";

import {
  Button,
} from "@/components/ui/button";

export default function TpoRecruiterAccessError({
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="border-t border-border pt-5 text-center"
    >
      <PageHeader title={"Couldn't load recruiter access"} />

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        The college&apos;s recruiter grants
        could not be retrieved. No active
        access or revoked-access conclusion
        has been inferred from this failure.
      </p>

      <Button
        className="mt-5"
        onClick={reset}
      >
        Retry
      </Button>
    </section>
  );
}
