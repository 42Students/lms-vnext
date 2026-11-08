"use client";
import { ButtonLink } from "@/components/ui/button-link";

import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function CollegeLectureHallsError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Lecture halls unavailable"
      description="The college lecture halls could not be loaded. No empty result is assumed."
      action={<><Button type="button" variant="secondary" onClick={reset} className="min-h-11 w-full md:min-h-9 md:w-auto">Retry</Button><ButtonLink href="/college" variant="secondary">College home</ButtonLink></>}
    />
  );
}
