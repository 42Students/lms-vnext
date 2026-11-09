"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
export default function AdminElectivesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Could not load elective slots"
    description="Elective data could not be loaded for your current college scope. This is not an empty elective list."
    action={<div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <Button type="button" onClick={reset} className="min-h-11 w-full sm:w-auto">Retry</Button>
      <ButtonLink variant="secondary" href="/admin/academics" className="min-h-11 w-full sm:w-auto">
        Academic setup
      </ButtonLink>
    </div>} />;
}
