"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
export default function FacultyDirectoryError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <div className="min-w-0 space-y-6"><PageHeader title="Faculty" /><ErrorState
    title="Faculty directory unavailable"
    description="The directory could not be loaded. No empty-result conclusion is assumed."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  /></div>;
}
