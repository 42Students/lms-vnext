"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="We couldn't load your profile"
    description="The profile service did not return your faculty record. Retry without leaving this page."
    action={<Button variant="primary" type="button" onClick={reset} className="w-full sm:w-auto"><svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.8"><path d="M16 6v4h-4"/><path d="M15.2 10A5.5 5.5 0 1 0 16 13"/></svg> Retry</Button>}
  />;
}
