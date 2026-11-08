"use client";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
export default function FacultyAssignmentsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Faculty assignments unavailable"
    description="The teaching-assignment source could not be loaded. No zero-value conclusion is assumed."
    action={<><Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button><ButtonLink href="/college/faculty" variant="secondary">Faculty directory</ButtonLink></>} />;
}
