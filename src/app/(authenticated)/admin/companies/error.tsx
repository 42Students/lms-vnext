"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
export default function CompaniesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Could not load companies" description="The company directory is unavailable. Your current scope has not changed." action={<Button onClick={reset}>Retry</Button>} />;
}
