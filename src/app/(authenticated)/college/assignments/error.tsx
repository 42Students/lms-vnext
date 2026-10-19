"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
export default function CollegeAssignmentsError({
  reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  return <section role="alert" className="py-5">
    <PageHeader title={"Assignments unavailable"} />
    <p className="mt-2 text-sm text-body">College assignments could not be loaded. No empty-result conclusion is assumed.</p>
    <Button className="mt-4" onClick={reset}>Retry</Button>
  </section>;
}
