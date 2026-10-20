"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function CollegeContactProfileErrorPage({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <div className="min-w-0 space-y-6"><PageHeader title="College contact profile" /><ErrorState title="College profile unavailable"
    description="The college contact profile could not be loaded. No blank values are assumed."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>} /></div>;
}
