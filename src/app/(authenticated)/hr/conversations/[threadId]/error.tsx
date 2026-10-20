"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

export default function RouteError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <>
    <PageHeader title="Messages" />
    <ErrorState
      title="Unable to load conversation"
      description="Message history could not be read. This does not mean there are no messages."
      action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
    />
  </>;
}
