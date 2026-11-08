"use client";

import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";
import { ErrorState } from "@/components/ui/error-state";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      title="Unable to load outcomes."
      description="The recorded after-college choices could not be retrieved. Retry to load them."
      action={<div className="flex min-w-0 flex-wrap items-center gap-3"><Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button><TextLink href="/tpo/settings" className="inline-flex min-h-11 items-center md:min-h-9">Back to settings</TextLink></div>}
    />
  );
}
