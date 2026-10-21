"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="We couldn't load your profile"
    description="We could not retrieve your profile. If the faculty record linked to it is missing, contact your college administrator. Retry without leaving this page."
    action={<Button variant="secondary" type="button" onClick={reset} className="w-full sm:w-auto">Retry</Button>}
  />;
}
