"use client";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
export default function RouteError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <div className="min-w-0 space-y-6"><PageHeader title="Register students" /><ErrorState title="Student registration unavailable"
    description="The registration form could not load. No student account was changed by this error screen."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>}/></div>;
}
