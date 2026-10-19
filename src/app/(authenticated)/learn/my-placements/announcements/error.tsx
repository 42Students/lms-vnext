"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState title={"Announcements unavailable"} description={"Your notices could not be loaded. No missing announcements were inferred."}
      action={<div className="flex flex-wrap items-center gap-3"><Button type="button" variant="secondary" onClick={reset}>Retry</Button></div>} />
  );
}
