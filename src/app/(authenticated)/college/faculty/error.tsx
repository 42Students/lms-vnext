"use client";
import { ButtonLink } from "@/components/ui/button-link";
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
    action={<><Button type="button" variant="secondary" onClick={reset} className="min-h-11 w-full md:min-h-9 md:w-auto">Retry</Button><ButtonLink href="/college" variant="secondary">College home</ButtonLink></>}
  /></div>;
}
