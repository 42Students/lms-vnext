"use client";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
export default function RouteError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <div className="min-w-0 space-y-6"><PageHeader title="Register students" /><ErrorState title="Student registration unavailable"
    description="The registration form could not load. No student account was changed by this error screen."
    action={<div className="flex flex-col gap-2 sm:flex-row"><Button type="button" variant="secondary" onClick={reset} className="min-h-11">Retry</Button><ButtonLink variant="secondary" href="/college/students" className="min-h-11">Student directory</ButtonLink></div>}/></div>;
}
