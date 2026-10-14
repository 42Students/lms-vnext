"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
export default function AdminElectivesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Could not load elective slots" description="Elective data could not be loaded for your current college scope." action={<Button onClick={reset}>Retry</Button>} />;
}
